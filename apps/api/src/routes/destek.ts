import { randomBytes } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { SupportMessage } from "../db/models/SupportMessage.js";
import { dogrula } from "../lib/dogrula.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { girisLimiti } from "../middleware/rateLimit.js";
import { destekSemasi } from "../validators/yonetim.js";

const router = Router();

const takipLimiti = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { hata: "Çok fazla istek. Biraz sonra tekrar deneyin." },
});

const takipSemasi = z.object({
  kodlar: z.array(z.string().trim().regex(/^[a-f0-9]{32}$/)).max(20),
});

router.post(
  "/",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const veri = dogrula(destekSemasi, req.body);
    const takipKodu = randomBytes(16).toString("hex");
    await SupportMessage.create({ ad: veri.ad, email: veri.email ?? "", mesaj: veri.mesaj, takipKodu });
    res.status(201).json({ mesaj: "Mesajınız alındı. Yanıtı bu pencerede görebilirsiniz.", takipKodu });
  })
);

// Kullanıcı yalnızca kendi tarayıcısında saklanan takip kodlarıyla kendi mesajlarını ve yanıtlarını görür.
router.post(
  "/takip",
  takipLimiti,
  asyncHandler(async (req, res) => {
    const { kodlar } = dogrula(takipSemasi, req.body);
    if (kodlar.length === 0) return res.json({ mesajlar: [] });
    const kayitlar = await SupportMessage.find({ takipKodu: { $in: kodlar } })
      .sort({ createdAt: -1 })
      .select("mesaj yanit yanitTarih createdAt takipKodu")
      .lean();
    res.json({
      mesajlar: kayitlar.map((k) => ({
        kod: k.takipKodu,
        mesaj: k.mesaj,
        yanit: k.yanit || "",
        yanitTarih: k.yanitTarih ?? null,
        tarih: k.createdAt,
      })),
    });
  })
);

export default router;
