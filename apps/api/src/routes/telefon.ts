import { randomInt, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { TelefonDogrulama } from "../db/models/TelefonDogrulama.js";
import { HttpHata } from "../lib/hata.js";
import { dogrula } from "../lib/dogrula.js";
import { tokenOzeti } from "../lib/tokens.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { girisLimiti } from "../middleware/rateLimit.js";
import { otpGonder } from "../services/whatsapp.js";
import { kodDogrulaSemasi, kodGonderSemasi } from "../validators/telefon.js";

const router = Router();

const KOD_SURESI_MS = 5 * 60 * 1000; // 5 dakika
const TEKRAR_BEKLEME_MS = 60 * 1000; // aynı numaraya 60 sn'de bir
const MAX_DENEME = 5;

// Kod her zaman 6 haneli, kriptografik rastgele.
const yeniKod = () => String(randomInt(100000, 1000000));
const kodOzetiUret = (telefon: string, kod: string) => tokenOzeti(`${telefon}:${kod}`);

router.post(
  "/kod-gonder",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const { telefon } = dogrula(kodGonderSemasi, req.body);
    const simdi = new Date();

    const mevcut = await TelefonDogrulama.findOne({ telefon });
    if (mevcut && simdi.getTime() - mevcut.sonGonderim.getTime() < TEKRAR_BEKLEME_MS) {
      throw new HttpHata(429, "Kısa süre önce kod gönderildi. Birkaç saniye sonra tekrar deneyin.");
    }

    const kod = yeniKod();
    await TelefonDogrulama.findOneAndUpdate(
      { telefon },
      {
        telefon,
        kodOzeti: kodOzetiUret(telefon, kod),
        denemeSayisi: 0,
        sonGonderim: simdi,
        sonTarih: new Date(simdi.getTime() + KOD_SURESI_MS),
      },
      { upsert: true }
    );

    try {
      await otpGonder(telefon, kod);
    } catch {
      // Gönderim başarısızsa kaydı temizle, kullanıcı hemen tekrar deneyebilsin.
      await TelefonDogrulama.deleteOne({ telefon });
      throw new HttpHata(503, "Kod şu an gönderilemedi. Biraz sonra tekrar deneyin.");
    }

    res.json({ mesaj: "Doğrulama kodu WhatsApp ile gönderildi.", gecerlilikDakika: 5 });
  })
);

router.post(
  "/kod-dogrula",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const { telefon, kod } = dogrula(kodDogrulaSemasi, req.body);
    const kayit = await TelefonDogrulama.findOne({ telefon });

    if (!kayit || kayit.sonTarih.getTime() < Date.now()) {
      throw new HttpHata(400, "Kodun süresi dolmuş ya da kod hiç istenmemiş. Yeni kod isteyin.");
    }
    if (kayit.denemeSayisi >= MAX_DENEME) {
      await TelefonDogrulama.deleteOne({ telefon });
      throw new HttpHata(429, "Çok fazla hatalı deneme. Yeni kod isteyin.");
    }

    const beklenen = Buffer.from(kayit.kodOzeti, "hex");
    const gelen = Buffer.from(kodOzetiUret(telefon, kod), "hex");
    const dogru = beklenen.length === gelen.length && timingSafeEqual(beklenen, gelen);

    if (!dogru) {
      kayit.denemeSayisi += 1;
      await kayit.save();
      throw new HttpHata(400, `Kod hatalı. Kalan deneme: ${MAX_DENEME - kayit.denemeSayisi}`);
    }

    await TelefonDogrulama.deleteOne({ telefon }); // kod tek kullanımlık
    res.json({ dogrulandi: true, telefon });
  })
);

export default router;
