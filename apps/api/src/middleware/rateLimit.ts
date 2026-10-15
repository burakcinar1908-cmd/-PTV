import rateLimit from "express-rate-limit";

export const girisLimiti = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { hata: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin." },
});
