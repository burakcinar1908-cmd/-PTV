"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { api } from "@/lib/api";
import { sonIzlenenEkle, type Kanal } from "@/lib/kanal";

const EN_FAZLA_YENIDEN_DENEME = 3;
const BASLAMA_ZAMAN_ASIMI_MS = 20000;

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

export default function Oynatici({ id }: { id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [kanal, setKanal] = useState<Kanal | null>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "oynatiliyor" | "hata">("yukleniyor");
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [tekrar, setTekrar] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let iptal = false;
    let oynatildi = false;
    let hls: Hls | null = null;
    let zamanAsimi: ReturnType<typeof setTimeout> | null = null;
    let oynatmaId: string | null = null;
    let kalpZamanlayici: ReturnType<typeof setInterval> | null = null;
    let mp: MpegtsPlayer | null = null;

    function hataGoster(metin: string) {
      setDurum("hata");
      setMesaj(metin);
      hls?.destroy();
      hls = null;
    }

    (async () => {
      setDurum("yukleniyor");
      setMesaj(null);

      const kanalSonuc = await api<{ kanal: Kanal }>(`/kanallar/${id}`, undefined, "GET");
      if (iptal) return;
      if (!kanalSonuc.ok) return hataGoster(kanalSonuc.mesaj);
      setKanal(kanalSonuc.veri.kanal);
      sonIzlenenEkle(kanalSonuc.veri.kanal);

      const yayin = await api<{ url: string; tur?: string; oynatmaId: string; kalpSaniye: number }>(`/kanallar/${id}/yayin`, undefined, "GET");
      if (iptal) return;
      if (!yayin.ok) return hataGoster(yayin.mesaj);

      // Worker içinde göreli URL çözülemez; mutlak adrese çevir.
      const url = new URL(yayin.veri.url, window.location.origin).toString();

      // Doğrudan dosya (MP4/MKV vb.) ise HLS yerine tarayıcının kendi oynatıcısını kullan.
      if ((yayin.veri as { tur?: string }).tur === "dogrudan") {
        video.src = url;
        video.addEventListener(
          "loadeddata",
          () => {
            if (iptal) return;
            oynatildi = true;
            setDurum("oynatiliyor");
            setMesaj(null);
            video.play().catch(() => {});
          },
          { once: true }
        );
        video.addEventListener(
          "error",
          () => hataGoster("Bu dosya tarayıcınızda oynatılamıyor. Biçim (MKV/MP4) desteklenmiyor ya da bağlantı geçersiz."),
          { once: true }
        );
        return;
      }
      oynatmaId = yayin.veri.oynatmaId;
      // Cihaz sınırı için düzenli kalp atışı gönder.
      const kalpId = oynatmaId;
      kalpZamanlayici = setInterval(() => {
        api("/kanallar/yayin/kalp", { oynatmaId: kalpId });
      }, yayin.veri.kalpSaniye * 1000);

      zamanAsimi = setTimeout(() => mpegtsDene(), BASLAMA_ZAMAN_ASIMI_MS);

      // HLS başlamazsa veya hata verirse tarayıcının kendi oynatıcısıyla dene.
      function natifeDene() {
        const video = videoRef.current;
        if (!video || iptal || oynatildi) return;
        hls?.destroy();
        hls = null;
        mp?.destroy();
        mp = null;
        video.src = url;
        video.addEventListener(
          "loadeddata",
          () => {
            if (iptal) return;
            oynatildi = true;
            setDurum("oynatiliyor");
            setMesaj(null);
            video.play().catch(() => {});
          },
          { once: true }
        );
        video.addEventListener(
          "error",
          () => hataGoster("Bu yayın tarayıcıda oynatılamadı. Kaynak yanıt vermiyor ya da biçim desteklenmiyor."),
          { once: true }
        );
        video.play().catch(() => {});
        if (zamanAsimi) clearTimeout(zamanAsimi);
        zamanAsimi = setTimeout(() => {
          if (!iptal && !oynatildi) {
            hataGoster("Yayın 30 saniyede başlamadı. Kaynak çok yavaş ya da erişilemez olabilir.");
          }
        }, 30000);
      }

      // Ham MPEG-TS yayınlarını mpegts.js ile oynat; olmazsa tarayıcının kendi oynatıcısına geç.
      async function mpegtsDene() {
        const video = videoRef.current;
        if (!video || iptal || oynatildi) return;
        hls?.destroy();
        hls = null;
        const modul = (await import("mpegts.js")).default as unknown as MpegtsModul;
        if (iptal || oynatildi) return;
        if (!modul.isSupported()) {
          natifeDene();
          return;
        }
        const oynatici = modul.createPlayer({ type: "mpegts", isLive: true, url }, { enableWorker: true });
        mp = oynatici;
        oynatici.on(modul.Events.ERROR, () => natifeDene());
        oynatici.attachMediaElement(video);
        video.addEventListener(
          "loadeddata",
          () => {
            if (iptal) return;
            oynatildi = true;
            setDurum("oynatiliyor");
            setMesaj(null);
            video.play().catch(() => {});
          },
          { once: true }
        );
        oynatici.load();
        if (zamanAsimi) clearTimeout(zamanAsimi);
        zamanAsimi = setTimeout(() => natifeDene(), 15000);
      }

      if (Hls.isSupported()) {
        let yenidenDeneme = 0;
        hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (iptal) return;
          oynatildi = true;
          setDurum("oynatiliyor");
          setMesaj(null);
          video.play().catch(() => {
            // Tarayıcı otomatik oynatmayı engellediyse kullanıcı oynat tuşuna basar.
          });
        });

        hls.on(Hls.Events.ERROR, (_olay, veri) => {
          if (!veri.fatal || !hls) return;
          if (yenidenDeneme >= EN_FAZLA_YENIDEN_DENEME) {
            return hataGoster("Yayın kaynağı yanıt vermiyor. Lütfen daha sonra tekrar deneyin.");
          }
          yenidenDeneme++;
          if (veri.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setMesaj(`Bağlantı koptu, yeniden bağlanılıyor (${yenidenDeneme}/${EN_FAZLA_YENIDEN_DENEME})...`);
            hls.startLoad();
          } else if (veri.type === Hls.ErrorTypes.MEDIA_ERROR) {
            setMesaj(`Görüntü hatası, kurtarılıyor (${yenidenDeneme}/${EN_FAZLA_YENIDEN_DENEME})...`);
            hls.recoverMediaError();
          } else {
            mpegtsDene();
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        oynatildi = true;
        setDurum("oynatiliyor");
      } else {
        hataGoster("Tarayıcınız bu yayın biçimini desteklemiyor.");
      }
    })();

    return () => {
      iptal = true;
      mp?.destroy();
      if (zamanAsimi) clearTimeout(zamanAsimi);
      if (kalpZamanlayici) clearInterval(kalpZamanlayici);
      if (oynatmaId) api(`/kanallar/yayin/${oynatmaId}`, undefined, "DELETE");
      hls?.destroy();
    };
  }, [id, tekrar]);

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-32">
      <h1 className="mb-6 text-2xl font-semibold">{kanal?.ad ?? "Kanal"}</h1>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
        <video ref={videoRef} controls playsInline className="aspect-video w-full bg-black" />
        {durum !== "oynatiliyor" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/85 p-6 text-center backdrop-blur-sm">
            {durum === "yukleniyor" && <p className="text-slate-300">Yayın hazırlanıyor...</p>}
            {durum === "hata" && (
              <>
                <p className="max-w-md text-rose-200">{mesaj}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setTekrar((n) => n + 1)} className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300">
                    Tekrar dene
                  </button>
                  <a href="/kanallar" className="rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10">Kanallara dön</a>
                </div>
                {mesaj?.includes("giriş") && <a href="/giris" className="text-sm text-cyan-300 hover:text-cyan-200">Giriş yap</a>}
                {mesaj?.includes("paket") && <a href="/#paketler" className="text-sm text-cyan-300 hover:text-cyan-200">Paketlere bak</a>}
              </>
            )}
          </div>
        )}
      </div>
      {durum === "oynatiliyor" && mesaj && <p className="mt-4 text-sm text-amber-300">{mesaj}</p>}
      {kanal?.aciklama && <p className="mt-6 text-slate-400">{kanal.aciklama}</p>}
    </div>
  );
}
