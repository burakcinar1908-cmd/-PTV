import { Router, type Request, type Response, type NextFunction } from "express";
import { Readable } from "node:stream";
import { Types } from "mongoose";
import { env } from "../env.js";
import { HttpHata } from "../lib/hata.js";
import { imzaGecerli } from "../lib/sinyal.js";
import { coz, guvenliAdresMi, m3u8Yeniden, ozelAdresMi } from "../lib/yayinProxy.js";
import { Channel } from "../db/channel.js";

const router = Router();
const KAYNAK_UALARI = ["Mozilla/5.0", "VLC/3.0.20 LibVLC/3.0.20"];
const UA_DEGISTIR_DURUMLARI = new Set([401, 403, 406, 451, 456, 458]);
const BAGLANTI_ZAMAN_ASIMI_MS = 15000;

function asenkron(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

// Yönlendirmeleri elle izler; her adım için iç ağ kontrolü yapılır.
async function guvenliGetir(
  baslangic: string,
  basliklar: Record<string, string>,
  signal: AbortSignal
): Promise<{ yanit: globalThis.Response; url: string }> {
  let adres = baslangic;
  for (let adim = 0; adim < 5; adim++) {
    if (!(await guvenliAdresMi(adres))) throw new HttpHata(400, "Geçersiz yayın adresi.");
    const yanit = await fetch(adres, { headers: basliklar, redirect: "manual", signal });
    const konum = yanit.headers.get("location");
    if (yanit.status >= 300 && yanit.status < 400 && konum) {
      await yanit.body?.cancel().catch(() => {});
      adres = new URL(konum, adres).toString();
      continue;
    }
    return { yanit, url: adres };
  }
  throw new HttpHata(502, "Çok fazla yönlendirme.");
}

router.get(
  "/:id",
  asenkron(async (req, res) => {
    if (!Types.ObjectId.isValid(req.params.id)) throw new HttpHata(404, "Kanal bulunamadı.");
    const kanalId = req.params.id;
    const bitis = Number(req.query.bitis);
    const sig = typeof req.query.sig === "string" ? req.query.sig : "";
    const alt = typeof req.query.u === "string" ? req.query.u : "";
    const yetkiAnahtari = alt ? `${kanalId}:${alt}` : kanalId;

    if (!Number.isFinite(bitis) || !imzaGecerli(env.STREAM_SIGNING_SECRET, yetkiAnahtari, bitis, sig)) {
      throw new HttpHata(403, "Yayın bağlantısının süresi dolmuş. Lütfen sayfayı yenileyin.");
    }

    const kanal = await Channel.findOne({ _id: kanalId, aktif: true }).select("+yayinUrl").lean();
    if (!kanal) throw new HttpHata(404, "Kanal bulunamadı.");

    let hedef: string = kanal.yayinUrl ?? "";
    if (!hedef) throw new HttpHata(404, "Kanal bulunamadı.");
    if (alt) hedef = coz(alt);
    if (alt && ozelAdresMi(hedef)) throw new HttpHata(400, "Geçersiz yayın adresi.");

    const kesici = new AbortController();
    req.on("close", () => kesici.abort());

    const range = typeof req.headers.range === "string" ? req.headers.range : undefined;
    let kaynak: globalThis.Response | null = null;
    let sonUrl = hedef;
    for (const ua of KAYNAK_UALARI) {
      const zamanAsimi = setTimeout(() => kesici.abort(), BAGLANTI_ZAMAN_ASIMI_MS);
      try {
        const sonuc = await guvenliGetir(hedef, { "User-Agent": ua, Accept: "*/*", ...(range ? { Range: range } : {}) }, kesici.signal);
        kaynak = sonuc.yanit;
        sonUrl = sonuc.url;
      } catch (err) {
        clearTimeout(zamanAsimi);
        if (err instanceof HttpHata) throw err;
        throw new HttpHata(502, "Yayın kaynağına ulaşılamadı.");
      }
      clearTimeout(zamanAsimi);
      if (kaynak.ok || !UA_DEGISTIR_DURUMLARI.has(kaynak.status)) break;
      await kaynak.body?.cancel().catch(() => {});
    }
    if (!kaynak || !kaynak.ok || !kaynak.body) throw new HttpHata(502, "Yayın kaynağı yanıt vermedi.");

    const tip = (kaynak.headers.get("content-type") ?? "").toLowerCase();
    const yolu = (() => {
      try {
        return new URL(sonUrl).pathname.toLowerCase();
      } catch {
        return "";
      }
    })();

    if (/mpegurl|m3u8/.test(tip) || yolu.endsWith(".m3u8")) {
      const metin = await kaynak.text();
      res.setHeader("Cache-Control", "no-store");
      if (metin.trimStart().startsWith("#EXTM3U")) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.send(m3u8Yeniden(metin, sonUrl, kanalId, bitis, env.STREAM_SIGNING_SECRET));
      } else {
        res.setHeader("Content-Type", tip || "text/plain");
        res.send(metin);
      }
      return;
    }

    res.status(kaynak.status === 206 ? 206 : 200);
    res.setHeader("Content-Type", kaynak.headers.get("content-type") ?? "video/mp2t");
    res.setHeader("Cache-Control", "no-store");
    for (const baslik of ["content-range", "accept-ranges", "content-length"]) {
      const deger = kaynak.headers.get(baslik);
      if (deger) res.setHeader(baslik, deger);
    }
    const akis = Readable.fromWeb(kaynak.body as import("node:stream/web").ReadableStream);
    akis.on("error", () => res.destroy());
    req.on("close", () => akis.destroy());
    akis.pipe(res);
  })
);

export default router;
