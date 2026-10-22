import { imzala } from "./sinyal.js";
import { lookup } from "node:dns/promises";
import net from "node:net";

export function kodla(adres: string): string {
  return Buffer.from(adres, "utf8").toString("base64url");
}

export function coz(kod: string): string {
  return Buffer.from(kod, "base64url").toString("utf8");
}

// Liste içinden türetilen adreslerin sunucuyu iç ağa yönlendirmesini engelleyen temel kontrol.
export function ozelAdresMi(adres: string): boolean {
  let host: string;
  try {
    const u = new URL(adres);
    if (u.protocol !== "http:" && u.protocol !== "https:") return true;
    host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  } catch {
    return true;
  }
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host === "::1" || host === "::" || host.startsWith("::ffff:") || /^f[cd][0-9a-f]{2}:/.test(host) || host.startsWith("fe80:")) return true;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

// HLS listesindeki tüm adresleri (parça, alt liste, anahtar) kendi imzalı proxy adresimize çevirir.
export function m3u8Yeniden(metin: string, taban: string, kanalId: string, bitis: number, gizliAnahtar: string): string {
  const baglan = (ham: string): string => {
    if (/^data:/i.test(ham)) return ham;
    let mutlak: string;
    try {
      mutlak = new URL(ham, taban).toString();
    } catch {
      return ham;
    }
    if (!/^https?:/i.test(mutlak)) return ham;
    const kod = kodla(mutlak);
    const sig = imzala(gizliAnahtar, `${kanalId}:${kod}`, bitis);
    return `/api/kanallar/${kanalId}/oynat?bitis=${bitis}&u=${kod}&sig=${sig}`;
  };

  return metin
    .split(/\r?\n/)
    .map((satir) => {
      const t = satir.trim();
      if (!t) return satir;
      if (t.startsWith("#")) return satir.replace(/URI="([^"]*)"/g, (_t, u: string) => `URI="${baglan(u)}"`);
      return baglan(t);
    })
    .join("\n");
}

// IP adresinin iç ağa ait olup olmadığını kontrol eder. DNS çözümünden sonra çağrılır.
export function ozelIpMi(ip: string): boolean {
  const tip = net.isIP(ip);
  if (tip === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (tip === 6) {
    const kucuk = ip.toLowerCase();
    if (kucuk === "::1" || kucuk === "::") return true;
    const gomulu = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(kucuk);
    if (gomulu) return ozelIpMi(gomulu[1]);
    if (/^f[cd]/.test(kucuk) || kucuk.startsWith("fe80")) return true;
    return false;
  }
  return true;
}

// Adres sözdizimi + DNS çözümü sonrası tüm IP'lerin genel olması şarttır.
export async function guvenliAdresMi(adres: string): Promise<boolean> {
  if (ozelAdresMi(adres)) return false;
  const host = new URL(adres).hostname.replace(/^\[|\]$/g, "");
  try {
    const kayitlar = await lookup(host, { all: true, verbatim: true });
    if (kayitlar.length === 0) return false;
    return kayitlar.every((k) => !ozelIpMi(k.address));
  } catch {
    return false;
  }
}
