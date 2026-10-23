import crypto from "node:crypto";

export type LinkYuku = { u: string; e: number };

// Yayın adresini istemciden gizler. Format: base64url(iv[12] | şifreli veri | tag[16]), anahtar = SHA-256(gizli).
// Worker aynı formatı çözer; bu yüzden formatı değiştirmeyin.
function anahtar(gizli: string): Buffer {
  return crypto.createHash("sha256").update(gizli).digest();
}

export function linkKapat(gizli: string, yuk: LinkYuku): string {
  const iv = crypto.randomBytes(12);
  const sifre = crypto.createCipheriv("aes-256-gcm", anahtar(gizli), iv);
  const ct = Buffer.concat([sifre.update(JSON.stringify(yuk), "utf8"), sifre.final()]);
  return Buffer.concat([iv, ct, sifre.getAuthTag()]).toString("base64url");
}
