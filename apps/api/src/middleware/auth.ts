import type { NextFunction, Request, Response } from "express";
import { Session } from "../db/models/Session.js";
import { User } from "../db/models/User.js";
import { tokenOzeti } from "../lib/tokens.js";
import { HttpHata } from "../lib/hata.js";
import { asyncHandler } from "./asyncHandler.js";

export const OTURUM_COOKIE = "sid";

// Web: httpOnly çerez. Mobil: Authorization: Bearer <token>.
export function oturumTokeni(req: Request): string | undefined {
  const bearer = req.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  return req.cookies?.[OTURUM_COOKIE] ?? bearer;
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = oturumTokeni(req);
  if (!token) throw new HttpHata(401, "Lütfen giriş yapın.");

  const oturum = await Session.findOne({ tokenHash: tokenOzeti(token), sonaErer: { $gt: new Date() } });
  if (!oturum) throw new HttpHata(401, "Oturumunuz sona erdi. Lütfen yeniden giriş yapın.");

  const kullanici = await User.findById(oturum.userId);
  if (!kullanici) throw new HttpHata(401, "Lütfen giriş yapın.");
  if (kullanici.dondurulduMu) throw new HttpHata(403, "Hesabınız dondurulmuş. Destek ile iletişime geçin.");

  await Session.updateOne({ _id: oturum._id }, { $set: { sonErisim: new Date() } });

  (req as Request & { kullanici?: unknown; oturumId?: string }).kullanici = kullanici;
  (req as Request & { oturumId?: string }).oturumId = String(oturum._id);
  next();
});

export const requireRole = (...roller: string[]) => (req: Request, _res: Response, next: NextFunction) => {
  const kullanici = (req as Request & { kullanici?: { rol: string } }).kullanici;
  if (!kullanici || !roller.includes(kullanici.rol)) {
    return next(new HttpHata(403, "Bu işlem için yetkiniz yok."));
  }
  next();
};
