import { Router, type Request } from "express";
import { z } from "zod";
import { Channel } from "../db/models/Channel.js";
import { Session } from "../db/models/Session.js";
import { User } from "../db/models/User.js";
import { HttpHata } from "../lib/hata.js";
import { dogrula } from "../lib/dogrula.js";
import { hashle, karsilastir } from "../lib/sifre.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { girisLimiti } from "../middleware/rateLimit.js";

const router = Router();
const KILIT_ACIK_KALMA_MS = 30 * 60 * 1000;

const pinSemasi = z.string().regex(/^\d{4,6}$/, "PIN 4 ila 6 rakamdan oluşmalı.");

function kullaniciId(req: Request) {
  return (req as Request & { kullanici: { _id: unknown } }).kullanici._id;
}

function oturumId(req: Request): string {
  return (req as Request & { oturumId?: string }).oturumId ?? "";
}

router.use(requireAuth);

router.get(
  "/kategoriler",
  asyncHandler(async (_req, res) => {
    const kategoriler = await Channel.distinct("kategori", { aktif: true });
    res.json({ kategoriler: kategoriler.sort((a, b) => a.localeCompare(b, "tr")) });
  })
);

router.get(
  "/ebeveyn",
  asyncHandler(async (req, res) => {
    const kullanici = await User.findById(kullaniciId(req)).select("+ebeveynPinHash ebeveynKategoriler ebeveynTumKanallar").lean();
    res.json({
      aktif: Boolean(kullanici?.ebeveynPinHash),
      kategoriler: kullanici?.ebeveynKategoriler ?? [],
      tumKanallar: Boolean(kullanici?.ebeveynTumKanallar),
    });
  })
);

const guncelleSemasi = z.object({
  mevcutPin: z.string().optional(),
  yeniPin: pinSemasi,
  kategoriler: z.array(z.string().trim().min(1).max(60)).max(100),
  tumKanallar: z.boolean().default(false),
});

// Ebeveyn kontrolünü açar veya ayarlarını değiştirir. Zaten PIN varsa mevcut PIN istenir.
router.put(
  "/ebeveyn",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const veri = dogrula(guncelleSemasi, req.body);
    const kullanici = await User.findById(kullaniciId(req)).select("+ebeveynPinHash").lean();
    if (kullanici?.ebeveynPinHash) {
      const dogru = veri.mevcutPin ? await karsilastir(veri.mevcutPin, kullanici.ebeveynPinHash) : false;
      if (!dogru) throw new HttpHata(403, "Mevcut PIN hatalı.");
    }
    await User.updateOne(
      { _id: kullaniciId(req) },
      { $set: { ebeveynPinHash: await hashle(veri.yeniPin), ebeveynKategoriler: veri.kategoriler, ebeveynTumKanallar: veri.tumKanallar } }
    );
    res.json({ mesaj: "Ebeveyn kontrolü kaydedildi." });
  })
);

router.delete(
  "/ebeveyn",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const veri = dogrula(z.object({ pin: pinSemasi }), req.body);
    const kullanici = await User.findById(kullaniciId(req)).select("+ebeveynPinHash").lean();
    if (!kullanici?.ebeveynPinHash || !(await karsilastir(veri.pin, kullanici.ebeveynPinHash))) {
      throw new HttpHata(403, "PIN hatalı.");
    }
    await User.updateOne(
      { _id: kullaniciId(req) },
      { $unset: { ebeveynPinHash: "" }, $set: { ebeveynKategoriler: [], ebeveynTumKanallar: false } }
    );
    res.json({ mesaj: "Ebeveyn kontrolü kapatıldı." });
  })
);

router.post(
  "/ebeveyn/kilit-ac",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const veri = dogrula(z.object({ pin: pinSemasi }), req.body);
    const kullanici = await User.findById(kullaniciId(req)).select("+ebeveynPinHash").lean();
    if (!kullanici?.ebeveynPinHash || !(await karsilastir(veri.pin, kullanici.ebeveynPinHash))) {
      throw new HttpHata(403, "PIN hatalı.");
    }
    await Session.updateOne(
      { _id: oturumId(req) },
      { $set: { ebeveynAcikTa: new Date(Date.now() + KILIT_ACIK_KALMA_MS) } }
    );
    res.json({ mesaj: "Kilit 30 dakika açıldı." });
  })
);

router.post(
  "/ebeveyn/kilitle",
  asyncHandler(async (req, res) => {
    await Session.updateOne({ _id: oturumId(req) }, { $unset: { ebeveynAcikTa: "" } });
    res.json({ mesaj: "Kilit yeniden etkinleştirildi." });
  })
);

export default router;
