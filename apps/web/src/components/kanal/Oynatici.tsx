"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { api } from "@/lib/api";
import { sonIzlenenEkle, type Kanal } from "@/lib/kanal";

type Durum = "yukleniyor" | "oynatiliyor" | "hata";
type MpegtsPlayer = {
  attachMediaElement(v: HTMLVideoElement): void;
  load(): void;
  destroy(): void;
  on(olay: string, cb: () => void): void;
};
type MpegtsModul = {
  isSupported(): boolean;
  createPlayer(c: { type: string; isLive: boolean; url: string }, o?: { enableWorker?: boolean }): MpegtsPlayer;
  Events: { ERROR: string };
};

const HLS_YENIDEN_DENEME = 3;
const TAKILMA_ESIGI_MS = 12000;

export default function Oynatici({ id }: { id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [kanal, setKanal] = useState<Kanal | null>(null);
  const [durum, setDurum] = useState<Durum>("yukleniyor");
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [tekrar, setTekrar] = useState(0);

  // Yayın başlatma: kanal bilgisi, oynatma bağlantısı, kalp atışı ve kaynak zinciri (hls → mpegts → native).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const v: HTMLVideoElement = video;
    let iptal = false;
    let oynatmaId: string | null = null;
    let kalp: ReturnType<typeof setInterval> | null = null;
    let hls: Hls | null = null;
    let mp: MpegtsPlayer | null = null;

    setDurum("yukleniyor");
    setMesaj(null);

    const hazir = () => {
      if (iptal) return;
      setDurum("oynatiliyor");
      setMesaj(null);
      v.play().catch(() => {});
    };
    const hata = (metin: string) => {
      if (iptal) return;
      setDurum("hata");
      setMesaj(metin);
    };
    const temizle = () => {
      hls?.destroy();
      hls = null;
      mp?.destroy();
      mp = null;
    };

    function nativeOynat(url: string) {
      temizle();
      v.src = url;
      v.addEventListener("loadeddata", hazir, { once: true });
      v.addEventListener(
        "error",
        () => hata("Bu yayın tarayıcıda oynatılamadı. Kaynak yanıt vermiyor ya da biçim desteklenmiyor."),
        { once: true }
      );
    }

    function mpegtsOynat(url: string) {
      temizle();
      (async () => {
        const modul = (await import("mpegts.js")).default as unknown as MpegtsModul;
        if (iptal) return;
        if (!modul.isSupported()) {
          nativeOynat(url);
          return;
        }
        const p = modul.createPlayer({ type: "mpegts", isLive: true, url }, { enableWorker: true });
        mp = p;
        p.on(modul.Events.ERROR, () => nativeOynat(url));
        p.attachMediaElement(v);
        v.addEventListener("loadeddata", hazir, { once: true });
        p.load();
      })();
    }

    function hlsOynat(url: string) {
      let denemeSayisi = 0;
      const h = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        backBufferLength: 30,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
        fragLoadingMaxRetry: 4,
      });
      hls = h;
      h.loadSource(url);
      h.attachMedia(v);
      h.on(Hls.Events.MANIFEST_PARSED, hazir);
      h.on(Hls.Events.ERROR, (_olay, veri) => {
        if (!veri.fatal) return;
        if (veri.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR || denemeSayisi >= HLS_YENIDEN_DENEME) {
          mpegtsOynat(url);
          return;
        }
        denemeSayisi++;
        if (veri.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setMesaj(`Bağlantı koptu, yeniden bağlanılıyor (${denemeSayisi}/${HLS_YENIDEN_DENEME})...`);
          h.startLoad();
        } else if (veri.type === Hls.ErrorTypes.MEDIA_ERROR) {
          setMesaj(`Görüntü hatası, kurtarılıyor (${denemeSayisi}/${HLS_YENIDEN_DENEME})...`);
          h.recoverMediaError();
        } else {
          mpegtsOynat(url);
        }
      });
    }

    (async () => {
      const kanalSonuc = await api<{ kanal: Kanal }>(`/kanallar/${id}`, undefined, "GET");
      if (iptal) return;
      if (!kanalSonuc.ok) return hata(kanalSonuc.mesaj);
      setKanal(kanalSonuc.veri.kanal);
      sonIzlenenEkle(kanalSonuc.veri.kanal);

      const yayin = await api<{ url: string; tur?: string; oynatmaId: string; kalpSaniye: number }>(
        `/kanallar/${id}/yayin`,
        undefined,
        "GET"
      );
      if (iptal) return;
      if (!yayin.ok) return hata(yayin.mesaj);

      const url = new URL(yayin.veri.url, window.location.origin).toString();
      if (yayin.veri.tur === "dogrudan") {
        nativeOynat(url);
        return;
      }

      oynatmaId = yayin.veri.oynatmaId;
      const kalpId = oynatmaId;
      if (iptal) {
        api(`/kanallar/yayin/${kalpId}`, undefined, "DELETE");
        return;
      }
      kalp = setInterval(() => {
        api("/kanallar/yayin/kalp", { oynatmaId: kalpId });
      }, yayin.veri.kalpSaniye * 1000);

      if (Hls.isSupported()) hlsOynat(url);
      else if (v.canPlayType("application/vnd.apple.mpegurl")) nativeOynat(url);
      else mpegtsOynat(url);
    })();

    return () => {
      iptal = true;
      if (kalp) clearInterval(kalp);
      temizle();
      if (oynatmaId) api(`/kanallar/yayin/${oynatmaId}`, undefined, "DELETE");
    };
  }, [id, tekrar]);

  // Takılma (sayaç ilerlemiyor) ya da bitişte oynatıcıyı baştan kurar.
  useEffect(() => {
    if (durum !== "oynatiliyor") return;
    const v = videoRef.current;
    if (!v) return;
    let sonZaman = v.currentTime;
    let sonDegisim = Date.now();
    const kontrol = setInterval(() => {
      if (v.paused) {
        sonDegisim = Date.now();
        return;
      }
      if (v.currentTime !== sonZaman) {
        sonZaman = v.currentTime;
        sonDegisim = Date.now();
        return;
      }
      if (Date.now() - sonDegisim > TAKILMA_ESIGI_MS) setTekrar((n) => n + 1);
    }, 3000);
    const bitti = () => setTekrar((n) => n + 1);
    v.addEventListener("ended", bitti);
    return () => {
      clearInterval(kontrol);
      v.removeEventListener("ended", bitti);
    };
  }, [durum]);

  const [kopyalandi, setKopyalandi] = useState(false);

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(`Kanal: ${id}\nSaat: ${new Date().toISOString()}\nHata: ${mesaj ?? "bilinmiyor"}`);
      setKopyalandi(true);
    } catch {
      setKopyalandi(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-8">
      <a href="/kanallar" className="inline-flex min-h-[44px] items-center text-[var(--muted)] hover:text-[var(--text)]">
        Kanallara dön
      </a>
      <h1 className="mt-2 text-4xl md:text-5xl">{kanal?.ad ?? "Kanal"}</h1>
      {kanal?.kategori && <p className="mt-1 text-[var(--muted)]">{kanal.kategori}</p>}

      <div className="relative mt-6 overflow-hidden rounded-xl border border-[var(--border)] bg-black" aria-busy={durum === "yukleniyor"}>
        <video ref={videoRef} controls playsInline className="aspect-video w-full bg-black" />
        {durum !== "oynatiliyor" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--bg)] p-6 text-center">
            {durum === "yukleniyor" && (
              <>
                <span aria-hidden="true" className="don h-8 w-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
                <p role="status" className="text-[var(--muted)]">
                  Yayın hazırlanıyor
                </p>
              </>
            )}
            {durum === "hata" && (
              <>
                <h2 className="text-3xl">Yayın açılamadı</h2>
                <p role="alert" className="max-w-md text-[var(--danger)]">
                  {mesaj}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setTekrar((n) => n + 1)} className="btn-primary">
                    Yeniden dene
                  </button>
                  <button type="button" onClick={kopyala} className="btn-secondary">
                    {kopyalandi ? "Kopyalandı" : "Hata ayrıntılarını kopyala"}
                  </button>
                </div>
                {mesaj?.includes("giriş") && (
                  <a href="/giris" className="text-[var(--accent)] underline underline-offset-4">
                    Giriş yap
                  </a>
                )}
                {mesaj?.includes("paket") && (
                  <a href="/#paketler" className="text-[var(--accent)] underline underline-offset-4">
                    Paketleri incele
                  </a>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {durum === "oynatiliyor" && mesaj && (
        <p role="status" className="mt-4 text-[0.9375rem] text-[var(--warning)]">
          {mesaj}
        </p>
      )}
      {kanal?.aciklama && <p className="mt-6 max-w-[65ch] text-[var(--muted)]">{kanal.aciklama}</p>}
    </div>
  );
}
