import type { Request } from "express";
import { Types } from "mongoose";
import { Session } from "../db/models/Session.js";
import { Subscription } from "../db/models/Subscription.js";
import { User } from "../db/models/User.js";
import { oturumTokeni } from "../middleware/auth.js";
import { tokenOzeti } from "../lib/tokens.js";

export type Erisim = {
  kullaniciId: Types.ObjectId;
  yonetici: boolean;
  planId: Types.ObjectId | null;
  cihazSiniri: number;
  kilitliKategoriler: string[];
};

// Oturum yoksa null döner. Yönetici her paketin kanallarını görür.
// Ebeveyn kilidi açıksa (PIN ile açılıp süresi dolmamışsa) kilitli kategoriler boş döner.
export async function erisimiCoz(req: Request): Promise<Erisim | null> {
  const token = oturumTokeni(req);
  if (!token) return null;

  const oturum = await Session.findOne({ tokenHash: tokenOzeti(token), sonaErer: { $gt: new Date() } }).lean();
  if (!oturum) return null;

  const kullanici = await User.findById(oturum.userId).select("rol ebeveynKategoriler dondurulduMu").lean();
  if (!kullanici || kullanici.dondurulduMu) return null;

  const kullaniciId = new Types.ObjectId(String(kullanici._id));
  const kilidiAcik = Boolean(oturum.ebeveynAcikTa && oturum.ebeveynAcikTa > new Date());
  const kilitliKategoriler = kilidiAcik ? [] : (kullanici.ebeveynKategoriler ?? []);

  if (kullanici.rol === "yonetici") {
    return { kullaniciId, yonetici: true, planId: null, cihazSiniri: Number.POSITIVE_INFINITY, kilitliKategoriler: [] };
  }

  const abonelik = await Subscription.findOne({
    userId: kullaniciId,
    durum: "aktif",
    bitis: { $gt: new Date() },
  }).lean();

  if (!abonelik) return { kullaniciId, yonetici: false, planId: null, cihazSiniri: 0, kilitliKategoriler };
  return {
    kullaniciId,
    yonetici: false,
    planId: new Types.ObjectId(String(abonelik.planId)),
    cihazSiniri: abonelik.cihazSiniri,
    kilitliKategoriler,
  };
}
