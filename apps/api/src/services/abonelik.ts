import { Subscription } from "../db/models/Subscription.js";

export async function aktifAboneligiVarMi(userId: unknown): Promise<boolean> {
  const varMi = await Subscription.exists({ userId, durum: "aktif", bitis: { $gt: new Date() } });
  return Boolean(varMi);
}
