import { Router, type Request, type Response } from "express";
import { env } from "../config/env.js";
import { User } from "../db/models/User.js";
import { Session } from "../db/models/Session.js";
import { HttpHata } from "../lib/hata.js";
import { hashle, karsilastir } from "../lib/sifre.js";
import { rastgeleToken, tokenOzeti } from "../lib/tokens.js";
import { mailGonder } from "../services/mail.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { OTURUM_COOKIE, oturumTokeni, requireAuth } from "../middleware/auth.js";
import { girisLimiti } from "../middleware/rateLimit.js";
import {
  epostaSemasi,
  girisSemasi,
  kayitSemasi,
  sifreSifirlaSemasi,
  tokenSemasi,
} from "../validators/auth.js";

const router = Router();

const OTURUM_SURESI_MS = 7 * 24 * 60 * 60 * 1000;
const KILIT_ESIGI = 5;
const KILIT_SURESI_MS = 15 * 60 * 1000;
const DOGRULAMA_SURESI_MS = 24 * 60 * 60 * 1000;
const SIFRE_SIFIRLAMA_SURESI_MS = 60 * 60 * 1000;

function dogrula<T>(semasi: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } }, veri: unknown): T {
  const sonuc = semasi.safeParse(veri);
  if (!sonuc.success) throw new HttpHata(400, sonuc.error.issues[0]?.message ?? "Geçersiz veri.");
  return sonuc.data;
}

function oturumCerezi(res: Response, token: string) {
  res.cookie(OTURUM_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OTURUM_SURESI_MS,
    path: "/",
  });
}

async function oturumAc(req: Request, res: Response, userId: unknown) {
  const token = rastgeleToken();
  // Mobil istemci çerez yerine bu başlığı okuyup Bearer olarak gönderir.
  if (req.get("x-client") === "mobile") res.setHeader("X-Oturum-Token", token);
  await Session.create({
    userId,
    tokenHash: tokenOzeti(token),
    ip: req.ip,
    userAgent: req.get("user-agent")?.slice(0, 255),
    sonaErer: new Date(Date.now() + OTURUM_SURESI_MS),
  });
  oturumCerezi(res, token);
}

function kullaniciGoster(u: { _id: unknown; ad: string; email: string; rol: string; emailDogrulandi: boolean; createdAt?: Date }) {
  return { id: String(u._id), ad: u.ad, email: u.email, rol: u.rol, emailDogrulandi: u.emailDogrulandi };
}

router.post(
  "/kayit",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const { ad, email, sifre } = dogrula(kayitSemasi, req.body);

    if (await User.exists({ email })) {
      throw new HttpHata(409, "Bu e-posta adresiyle zaten bir hesap var.");
    }

    const dogrulamaToken = rastgeleToken();
    const user = await User.create({
      ad,
      email,
      sifreHash: await hashle(sifre),
      dogrulamaTokenHash: tokenOzeti(dogrulamaToken),
      dogrulamaSonTarih: new Date(Date.now() + DOGRULAMA_SURESI_MS),
    });

    const link = `${env.WEB_ORIGIN}/dogrula?token=${dogrulamaToken}`;
    try {
      await mailGonder(
        email,
        "E-posta adresinizi doğrulayın",
        `Merhaba ${ad},\n\nHesabınızı doğrulamak için bu bağlantıyı açın (24 saat geçerli):\n${link}\n\nMobil uygulamada bu kodu yapıştırabilirsiniz:\n${dogrulamaToken}`
      );
    } catch (err) {
      console.error("[mail] kayıt doğrulama maili gönderilemedi:", err instanceof Error ? err.message : err);
      // Kayıt kaydedildi. Mail gitmediyse kullanıcı "doğrulama e-postasını tekrar gönder" ile yeniden isteyebilir.
    }

    res.status(201).json({
      mesaj: "Kayıt başarılı. Lütfen e-posta adresinize gönderilen bağlantıyla hesabınızı doğrulayın.",
      kullanici: kullaniciGoster({ ...user.toObject(), rol: user.rol }),
    });
  })
);

router.post(
  "/dogrula",
  asyncHandler(async (req, res) => {
    const { token } = dogrula(tokenSemasi, req.body);
    const user = await User.findOne({
      dogrulamaTokenHash: tokenOzeti(token),
      dogrulamaSonTarih: { $gt: new Date() },
    }).select("+dogrulamaTokenHash +dogrulamaSonTarih");

    if (!user) throw new HttpHata(400, "Doğrulama bağlantısı geçersiz veya süresi dolmuş.");

    user.emailDogrulandi = true;
    user.set("dogrulamaTokenHash", undefined);
    user.set("dogrulamaSonTarih", undefined);
    await user.save();

    res.json({ mesaj: "E-posta adresiniz doğrulandı. Artık giriş yapabilirsiniz." });
  })
);

router.post(
  "/dogrulama-tekrar",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const { email } = dogrula(epostaSemasi, req.body);
    const user = await User.findOne({ email });

    // Hesabın var olup olmadığını sızdırmamak için yanıt her durumda aynı.
    if (user && !user.emailDogrulandi) {
      const token = rastgeleToken();
      user.dogrulamaTokenHash = tokenOzeti(token);
      user.dogrulamaSonTarih = new Date(Date.now() + DOGRULAMA_SURESI_MS);
      await user.save();

      const link = `${env.WEB_ORIGIN}/dogrula?token=${token}`;
      try {
        await mailGonder(
          email,
          "E-posta adresinizi doğrulayın",
          `Merhaba ${user.ad},\n\nHesabınızı doğrulamak için bu bağlantıyı açın (24 saat geçerli):\n${link}\n\nMobil uygulamada bu kodu yapıştırabilirsiniz:\n${token}`
        );
      } catch (err) {
        console.error("[mail] doğrulama tekrar maili gönderilemedi:", err instanceof Error ? err.message : err);
        throw new HttpHata(503, "E-posta şu an gönderilemedi. Biraz sonra tekrar deneyin.");
      }
    }

    res.json({ mesaj: "Bu e-posta ile bir hesap varsa doğrulama bağlantısı gönderildi." });
  })
);

router.post(
  "/giris",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const { email, sifre } = dogrula(girisSemasi, req.body);
    const genelHata = new HttpHata(401, "E-posta veya şifre hatalı.");

    const user = await User.findOne({ email }).select("+sifreHash +basarisizGiris +kilitliYonelimi");
    if (!user) throw genelHata;

    if (user.kilitliYonelimi && user.kilitliYonelimi > new Date()) {
      throw new HttpHata(423, "Çok fazla hatalı deneme. Hesap geçici olarak kilitlendi, lütfen 15 dakika sonra tekrar deneyin.");
    }

    const dogru = await karsilastir(sifre, user.sifreHash);
    if (!dogru) {
      user.basarisizGiris = (user.basarisizGiris ?? 0) + 1;
      if (user.basarisizGiris >= KILIT_ESIGI) {
        user.kilitliYonelimi = new Date(Date.now() + KILIT_SURESI_MS);
        user.basarisizGiris = 0;
      }
      await user.save();
      throw genelHata;
    }

    if (!user.emailDogrulandi) {
      throw new HttpHata(403, "Giriş yapmadan önce e-posta adresinizi doğrulayın.");
    }

    user.basarisizGiris = 0;
    user.kilitliYonelimi = undefined;
    await user.save();

    await oturumAc(req, res, user._id);
    res.json({ kullanici: kullaniciGoster(user.toObject()) });
  })
);

router.post(
  "/cikis",
  asyncHandler(async (req, res) => {
    // Mobil (Bearer) ve web (çerez) oturumları sunucuda da kapatılır.
    const token = oturumTokeni(req);
    if (token) await Session.deleteOne({ tokenHash: tokenOzeti(token) });
    res.clearCookie(OTURUM_COOKIE, { path: "/" });
    res.json({ mesaj: "Çıkış yapıldı." });
  })
);

router.get(
  "/ben",
  requireAuth,
  asyncHandler(async (req, res) => {
    const kullanici = (req as Request & { kullanici: Parameters<typeof kullaniciGoster>[0] }).kullanici;
    res.json({ kullanici: kullaniciGoster(kullanici) });
  })
);

router.post(
  "/sifre-sifirla-iste",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const { email } = dogrula(epostaSemasi, req.body);
    const user = await User.findOne({ email });

    if (user) {
      const token = rastgeleToken();
      user.sifreSifirlaTokenHash = tokenOzeti(token);
      user.sifreSifirlaSonTarih = new Date(Date.now() + SIFRE_SIFIRLAMA_SURESI_MS);
      await user.save();

      const link = `${env.WEB_ORIGIN}/sifre-sifirla?token=${token}`;
      await mailGonder(
        email,
        "Şifre sıfırlama bağlantısı",
        `Şifrenizi sıfırlamak için bu bağlantıyı açın (1 saat geçerli):\n${link}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayın.`
      );
    }

    // Hesabın var olup olmadığı yanıttan anlaşılmasın.
    res.json({ mesaj: "E-posta adresiniz kayıtlıysa şifre sıfırlama bağlantısı gönderildi." });
  })
);

router.post(
  "/sifre-sifirla",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const { token, yeniSifre } = dogrula(sifreSifirlaSemasi, req.body);
    const user = await User.findOne({
      sifreSifirlaTokenHash: tokenOzeti(token),
      sifreSifirlaSonTarih: { $gt: new Date() },
    }).select("+sifreSifirlaTokenHash +sifreSifirlaSonTarih");

    if (!user) throw new HttpHata(400, "Sıfırlama bağlantısı geçersiz veya süresi dolmuş.");

    user.sifreHash = await hashle(yeniSifre);
    user.set("sifreSifirlaTokenHash", undefined);
    user.set("sifreSifirlaSonTarih", undefined);
    user.basarisizGiris = 0;
    await user.save();

    // Şifre değiştiğinde tüm oturumları kapat.
    await Session.deleteMany({ userId: user._id });

    res.json({ mesaj: "Şifreniz güncellendi. Lütfen yeni şifrenizle giriş yapın." });
  })
);

export default router;
