import crypto from "node:crypto";

// Yayın bağlantısı için kısa süreli HMAC imzası. Gizli anahtar çağıran tarafından verilir.
export function imzala(gizliAnahtar: string, kanalId: string, bitis: number): string {
  return crypto.createHmac("sha256", gizliAnahtar).update(`${kanalId}.${bitis}`).digest("hex");
}

export function imzaGecerli(gizliAnahtar: string, kanalId: string, bitis: number, sig: string): boolean {
  if (Date.now() > bitis) return false;
  const beklenen = Buffer.from(imzala(gizliAnahtar, kanalId, bitis));
  const gelen = Buffer.from(sig);
  return beklenen.length === gelen.length && crypto.timingSafeEqual(beklenen, gelen);
}
