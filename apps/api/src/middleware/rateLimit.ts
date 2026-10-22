import type { NextFunction, Request, Response } from "express";
import { RateLimit } from "../db/models/RateLimit.js";
import { HttpHata } from "../lib/hata.js";

// Sabit pencere: her IP için pencere başına en fazla `limit` istek.
export function hizSiniri(ad: string, limit: number, pencereMs: number, mesaj: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const simdi = Date.now();
    const pencere = Math.floor(simdi / pencereMs);
    const sifirlanma = new Date((pencere + 1) * pencereMs);
    RateLimit.findOneAndUpdate(
      { anahtar: `${ad}:${req.ip}:${pencere}` },
      { $inc: { sayac: 1 }, $setOnInsert: { sifirlanma } },
      { upsert: true, new: true }
    )
      .then((kayit) => {
        if (kayit && kayit.sayac > limit) throw new HttpHata(429, mesaj);
        next();
      })
      .catch(next);
  };
}

export const girisLimiti = hizSiniri(
  "giris",
  20,
  15 * 60 * 1000,
  "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin."
);
