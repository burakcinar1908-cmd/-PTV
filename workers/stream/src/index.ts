// Yayın proxy'si (Cloudflare Worker). Stream sunucusunun yerine geçer; istemci tarafı değişmez.
// Yayın adresi api tarafından şifrelenmiş bir token olarak gelir; Worker token'ı çözer, kaynağı açar.

export interface Env {
  STREAM_SIGNING_SECRET: string;
  WEB_ORIGIN: string;
}

type Yuk = { u: string; e: number };

const KAYNAK_UALARI = ["Mozilla/5.0", "VLC/3.0.20 LibVLC/3.0.20"];
const UA_DEGISTIR = new Set([401, 403, 406, 451, 456, 458]);
const enc = new TextEncoder();
const dec = new TextDecoder();

async function anahtar(gizli: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(gizli));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function b64uCoz(s: string): Uint8Array {
  const b = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64uYaz(bytes: Uint8Array): string {
  let bin = "";
  for (const x of bytes) bin += String.fromCharCode(x);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function coz(env: Env, token: string): Promise<Yuk> {
  const raw = b64uCoz(token);
  if (raw.length < 29) throw new Error("kisa token");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, await anahtar(env.STREAM_SIGNING_SECRET), raw.slice(12));
  return JSON.parse(dec.decode(pt)) as Yuk;
}

async function kapat(env: Env, yuk: Yuk): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await anahtar(env.STREAM_SIGNING_SECRET), enc.encode(JSON.stringify(yuk)))
  );
  const out = new Uint8Array(12 + ct.length);
  out.set(iv, 0);
  out.set(ct, 12);
  return b64uYaz(out);
}

// Açık iç ağ adreslerini reddeder. DNS çözümü sonrası kontrol Worker'da yapılamaz; kısmi koruma.
function gecerliUrl(u: string): URL | null {
  try {
    const x = new URL(u);
    if (x.protocol !== "http:" && x.protocol !== "https:") return null;
    const h = x.hostname;
    if (h === "localhost" || h === "0.0.0.0" || h === "[::1]" || h.startsWith("127.") || h.startsWith("10.") || h.startsWith("192.168.") || h.startsWith("169.254.")) return null;
    return x;
  } catch {
    return null;
  }
}

async function kaynakGetir(hedef: string, range: string | null): Promise<{ res: Response; url: string } | null> {
  for (const ua of KAYNAK_UALARI) {
    let adres = hedef;
    let sonuc: { res: Response; url: string } | null = null;
    for (let adim = 0; adim < 5; adim++) {
      const x = gecerliUrl(adres);
      if (!x) return null;
      const res = await fetch(x.toString(), {
        headers: { "User-Agent": ua, Accept: "*/*", ...(range ? { Range: range } : {}) },
        redirect: "manual",
      });
      const konum = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && konum) {
        await res.body?.cancel();
        adres = new URL(konum, adres).toString();
        continue;
      }
      sonuc = { res, url: x.toString() };
      break;
    }
    if (!sonuc) return null;
    if (sonuc.res.ok || !UA_DEGISTIR.has(sonuc.res.status)) return sonuc;
    await sonuc.res.body?.cancel();
  }
  return null;
}

const TASINAN_BASLIKLAR = ["content-range", "accept-ranges", "content-length"];

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const cors: Record<string, string> = {
      "Access-Control-Allow-Origin": env.WEB_ORIGIN,
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (url.pathname === "/health") return Response.json({ durum: "ok" }, { headers: cors });

    const m = /^\/(y|s)\/([A-Za-z0-9_-]+)$/.exec(url.pathname);
    if (!m || (req.method !== "GET" && req.method !== "HEAD")) {
      return new Response("Bulunamadı", { status: 404, headers: cors });
    }

    let yuk: Yuk;
    try {
      yuk = await coz(env, m[2]);
    } catch {
      return new Response("Geçersiz bağlantı", { status: 403, headers: cors });
    }
    if (Date.now() > yuk.e) {
      return new Response("Bağlantının süresi doldu. Sayfayı yenileyin.", { status: 403, headers: cors });
    }

    const sonuc = await kaynakGetir(yuk.u, req.headers.get("Range"));
    if (!sonuc) return new Response("Yayın kaynağına ulaşılamadı.", { status: 502, headers: cors });

    const tip = (sonuc.res.headers.get("content-type") ?? "").toLowerCase();
    const liste = sonuc.url.split("?")[0].toLowerCase();
    if (/mpegurl|m3u8/.test(tip) || liste.endsWith(".m3u8")) {
      const metin = await sonuc.res.text();
      if (!metin.trimStart().startsWith("#EXTM3U")) {
        return new Response(metin, { headers: { ...cors, "Content-Type": tip || "text/plain", "Cache-Control": "no-store" } });
      }
      // Liste içindeki her adres de token'lı /s/ yoluna çevrilir; istemci kaynağı hiç görmez.
      const yaz = async (ham: string) => `${url.origin}/s/${await kapat(env, { u: new URL(ham, sonuc.url).toString(), e: yuk.e })}`;
      const satirlar: string[] = [];
      for (const satir of metin.split(/\r?\n/)) {
        const t = satir.trim();
        if (!t) {
          satirlar.push(satir);
        } else if (t.startsWith("#")) {
          let yeni = satir;
          for (const eslesme of satir.matchAll(/URI="([^"]+)"/g)) {
            yeni = yeni.replace(eslesme[0], `URI="${await yaz(eslesme[1])}"`);
          }
          satirlar.push(yeni);
        } else {
          satirlar.push(await yaz(t));
        }
      }
      return new Response(satirlar.join("\n"), {
        headers: { ...cors, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" },
      });
    }

    const basliklar = new Headers(cors);
    basliklar.set("Content-Type", sonuc.res.headers.get("content-type") ?? "video/mp2t");
    basliklar.set("Cache-Control", "no-store");
    for (const ad of TASINAN_BASLIKLAR) {
      const deger = sonuc.res.headers.get(ad);
      if (deger) basliklar.set(ad, deger);
    }
    return new Response(sonuc.res.body, { status: sonuc.res.status, headers: basliklar });
  },
};
