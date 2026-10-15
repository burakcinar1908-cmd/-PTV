import { Router, type Request } from "express";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { Plan } from "../db/models/Plan.js";
import { Subscription } from "../db/models/Subscription.js";
import { HttpHata } from "../lib/hata.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { aktifAboneligiVarMi } from "../services/abonelik.js";

const router = Router();

function kullaniciId(req: Request): Types.ObjectId {
  return (req as Request & { kullanici: { _id: Types.ObjectId } }).kullanici._id;
}

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const paketler = await Plan.find({ aktif: true }).sort({ siralama: 1 }).lean();
    res.json({
      paketler: paketler.map((p) => ({
        id: String(p._id),
        ad: p.ad,
        cihazSiniri: p.cihazSiniri,
        sureSecenekleri: p.sureSecenekleri,
        ozellikler: p.ozellikler,
      })),
    });
  })
);

router.get(
  "/abonelik",
  requireAuth,
  asyncHandler(async (req, res) => {
    const aktif = await Subscription.findOne({
      userId: kullaniciId(req),
      durum: "aktif",
      bitis: { $gt: new Date() },
    })
      .populate("planId", "ad")
      .lean();

    if (!aktif) {
      res.json({ abonelik: null });
      return;
    }
    const plan = aktif.planId as unknown as { ad: string };
    res.json({
      abonelik: {
        paket: plan.ad,
        ay: aktif.ay,
        cihazSiniri: aktif.cihazSiniri,
        bitis: aktif.bitis,
        saglayici: aktif.saglayici,
      },
    });
  })
);

// Şimdilik yalnızca demo: ödeme alınmaz, seçilen süre kadar paket hemen aktif olur.
router.post(
  "/:id/demo-satin-al",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (env.DEMO_ODEME !== "true") {
      throw new HttpHata(403, "Ödeme sistemi henüz etkin değil.");
    }
    if (!Types.ObjectId.isValid(req.params.id)) throw new HttpHata(404, "Paket bulunamadı.");

    const userId = kullaniciId(req);
    if (await aktifAboneligiVarMi(userId)) {
      throw new HttpHata(409, "Zaten aktif bir paketiniz var.");
    }

    const plan = await Plan.findOne({ _id: req.params.id, aktif: true }).lean();
    if (!plan) throw new HttpHata(404, "Paket bulunamadı.");

    const ay = Number((req.body as { ay?: unknown } | undefined)?.ay);
    if (!plan.sureSecenekleri.some((s) => s.ay === ay)) {
      throw new HttpHata(400, "Geçersiz süre seçimi.");
    }

    const baslangic = new Date();
    const bitis = new Date(baslangic);
    bitis.setMonth(bitis.getMonth() + ay);

    await Subscription.create({
      userId,
      planId: plan._id,
      ay,
      cihazSiniri: plan.cihazSiniri,
      durum: "aktif",
      baslangic,
      bitis,
      saglayici: "demo",
    });

    res.status(201).json({ mesaj: `${plan.ad} paketi ${ay} aylık olarak etkinleştirildi.` });
  })
);

export default router;
