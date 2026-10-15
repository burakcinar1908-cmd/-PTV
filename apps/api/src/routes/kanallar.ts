import { Router, type Request } from "express";
import { Readable } from "node:stream";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { Channel } from "../db/models/Channel.js";
import { Favorite } from "../db/models/Favorite.js";
import { IzlemeOturumu } from "../db/models/IzlemeOturumu.js";
import { HttpHata } from "../lib/hata.js";
import { rastgeleToken } from "../lib/tokens.js";
import { dogrula } from "../lib/dogrula.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { yayinTuru } from "../services/m3u.js";
import { requireAuth } from "../middleware/auth.js";
import { erisimiCoz, type Erisim } from "../services/erisim.js";
import { imzala, imzaGecerli } from "../services/sinyal.js";
import { z } from "zod";

const router = Router();
const YAYIN_SURESI_MS = 5 * 60 * 1000;
const KALP_ASIMI_MS = 90 * 1000;
const KALP_ARALIGI_SANIYE = 60;
const META = "ad slug kategori logo aciklama";

function gecerliId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new HttpHata(404, "Kanal bulunamadı.");
  return new Types.ObjectId(id);
}

function kullaniciId(req: Request): Types.ObjectId {
  return (req as Request & { kullanici: { _id: Types.ObjectId } }).kullanici._id;
}

function regexKacis(metin: string): string {
  return metin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Kullanıcının göreceği kanalların filtresi. Paketi yoksa null: hiçbir kanal görünmez.
function kanalFiltresi(erisim: Erisim | null): Record<string, unknown> | null {
  if (!erisim) return null;
  if (erisim.yonetici) return {};
  if (!erisim.planId) return null;
  const kilit = erisim.kilitliKategoriler.length ? { kategori: { $nin: erisim.kilitliKategoriler } } : {};
  return { paketler: erisim.planId, ...kilit };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const erisim = await erisimiCoz(req);
    const filtre = kanalFiltresi(erisim);
    if (!filtre) {
      res.json({ kanallar: [], kategoriler: [], paketGerekli: true, kilitliKategoriler: [] });
      return;
    }

    const sorgu: Record<string, unknown> = { aktif: true, ...filtre };
    const kategori = typeof req.query.kategori === "string" ? req.query.kategori.trim() : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 60) : "";
    if (kategori) sorgu.kategori = kategori;
    if (q) sorgu.ad = { $regex: regexKacis(q), $options: "i" };

    const [kanallar, kategoriler] = await Promise.all([
      Channel.find(sorgu).select(META).sort({ siralama: 1, ad: 1 }).limit(300).lean(),
      Channel.distinct("kategori", { aktif: true, ...filtre }),
    ]);

    res.json({
      kanallar: kanallar.map((k) => ({ ...k, id: String(k._id), _id: undefined })),
      kategoriler: kategoriler.sort((a, b) => a.localeCompare(b, "tr")),
      paketGerekli: false,
      kilitliKategoriler: erisim?.kilitliKategoriler ?? [],
    });
  })
);

router.get(
  "/favoriler",
  requireAuth,
  asyncHandler(async (req, res) => {
    const favoriler = await Favorite.find({ userId: kullaniciId(req) }).select("channelId").lean();
    res.json({ idler: favoriler.map((f) => String(f.channelId)) });
  })
);

router.post(
  "/favoriler/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const kanalId = gecerliId(req.params.id);
    const varMi = await Channel.exists({ _id: kanalId, aktif: true });
    if (!varMi) throw new HttpHata(404, "Kanal bulunamadı.");
    const userId = kullaniciId(req);
    await Favorite.updateOne(
      { userId, channelId: kanalId },
      { $setOnInsert: { userId, channelId: kanalId } },
      { upsert: true }
    );
    res.json({ mesaj: "Favorilere eklendi." });
  })
);

router.delete(
  "/favoriler/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const kanalId = gecerliId(req.params.id);
    await Favorite.deleteOne({ userId: kullaniciId(req), channelId: kanalId });
    res.json({ mesaj: "Favorilerden çıkarıldı." });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const filtre = kanalFiltresi(await erisimiCoz(req));
    if (!filtre) throw new HttpHata(403, "Bu kanalı görmek için bir paket seçin.");
    const kanal = await Channel.findOne({ _id: gecerliId(req.params.id), aktif: true, ...filtre })
      .select(META)
      .lean();
    if (!kanal) throw new HttpHata(404, "Kanal bulunamadı.");
    res.json({ kanal: { ...kanal, id: String(kanal._id), _id: undefined } });
  })
);

router.get(
  "/:id/yayin",
  asyncHandler(async (req, res) => {
    const erisim = await erisimiCoz(req);
    if (!erisim) throw new HttpHata(401, "Lütfen giriş yapın.");
    const filtre = kanalFiltresi(erisim);
    if (!filtre) throw new HttpHata(403, "Bu yayını izlemek için bir paket seçin.");

    const kanalId = gecerliId(req.params.id);
    const varMi = await Channel.exists({ _id: kanalId, aktif: true, ...filtre });
    if (!varMi) {
      const paketteVar = await Channel.exists({ _id: kanalId, aktif: true, paketler: erisim.planId });
      if (paketteVar) throw new HttpHata(403, "Bu kanal ebeveyn kontrolü ile kilitli. Kilidi PIN ile açın.");
      throw new HttpHata(404, "Kanal bulunamadı.");
    }

    if (!erisim.yonetici) {
      const aktifIzleme = await IzlemeOturumu.countDocuments({
        userId: erisim.kullaniciId,
        sonKalp: { $gt: new Date(Date.now() - KALP_ASIMI_MS) },
      });
      if (aktifIzleme >= erisim.cihazSiniri) {
        throw new HttpHata(
          403,
          `Paketinizde aynı anda en fazla ${erisim.cihazSiniri} cihazda izleyebilirsiniz. Başka bir izlemeyi kapatıp tekrar deneyin.`
        );
      }
    }

    const oynatmaId = rastgeleToken(16);
    await IzlemeOturumu.create({ userId: erisim.kullaniciId, kanalId, oynatmaId, sonKalp: new Date() });

    const id = String(kanalId);
    const bitis = Date.now() + YAYIN_SURESI_MS;
    const sig = imzala(env.STREAM_SIGNING_SECRET, id, bitis);
    const kanalYayin = await Channel.findById(kanalId).select("+yayinUrl").lean();
    res.json({
      tur: yayinTuru(kanalYayin?.yayinUrl ?? ""),
      url: `/api/kanallar/${id}/oynat?bitis=${bitis}&sig=${sig}`,
      sureSaniye: YAYIN_SURESI_MS / 1000,
      oynatmaId,
      kalpSaniye: KALP_ARALIGI_SANIYE,
    });
  })
);

const kalpSemasi = z.object({ oynatmaId: z.string().min(10).max(64) });

router.post(
  "/yayin/kalp",
  requireAuth,
  asyncHandler(async (req, res) => {
    const veri = dogrula(kalpSemasi, req.body);
    const sonuc = await IzlemeOturumu.updateOne(
      { oynatmaId: veri.oynatmaId, userId: kullaniciId(req) },
      { $set: { sonKalp: new Date() } }
    );
    if (sonuc.matchedCount === 0) throw new HttpHata(404, "Oynatma oturumu bulunamadı.");
    res.json({ ok: true });
  })
);

router.delete(
  "/yayin/:oynatmaId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await IzlemeOturumu.deleteOne({ oynatmaId: req.params.oynatmaId, userId: kullaniciId(req) });
    res.json({ ok: true });
  })
);

router.get(
  "/:id/oynat",
  asyncHandler(async (req, res) => {
    const kanalId = gecerliId(req.params.id);
    const bitis = Number(req.query.bitis);
    const sig = typeof req.query.sig === "string" ? req.query.sig : "";

    if (!Number.isFinite(bitis) || !imzaGecerli(env.STREAM_SIGNING_SECRET, String(kanalId), bitis, sig)) {
      throw new HttpHata(403, "Yayın bağlantısının süresi dolmuş. Lütfen sayfayı yenileyin.");
    }

    const kanal = await Channel.findOne({ _id: kanalId, aktif: true }).select("+yayinUrl").lean();
    if (!kanal) throw new HttpHata(404, "Kanal bulunamadı.");

    let kaynak: globalThis.Response;
    try {
      kaynak = await fetch(kanal.yayinUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    } catch {
      throw new HttpHata(502, "Yayın kaynağına ulaşılamadı.");
    }
    if (!kaynak.ok || !kaynak.body) throw new HttpHata(502, "Yayın kaynağı yanıt vermedi.");

    res.status(200);
    res.setHeader("Content-Type", kaynak.headers.get("content-type") ?? "video/mp2t");
    res.setHeader("Cache-Control", "no-store");
    const akis = Readable.fromWeb(kaynak.body as import("node:stream/web").ReadableStream);
    req.on("close", () => akis.destroy());
    akis.on("error", () => res.destroy());
    akis.pipe(res);
  })
);

export default router;
