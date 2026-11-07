"use client";

import { useEffect, useRef } from "react";

// Kaydırmaya bağlı sahne: test kalıbı → kanal ızgarası → başlık. Tuval üzerinde çizilir, video dosyası gerektirmez.
const BG = "#0d2b33";
const SURFACE = "#12363f";
const BORDER = "rgba(234, 246, 244, 0.14)";
const ACCENT = "#ffc233";
const TEXT = "#eaf6f4";
const MUTED = "#9fc3c6";
const TEST = ["#bfbfbf", "#bfbf30", "#30bfbf", "#30bf30", "#bf30bf", "#bf3030", "#3030bf"];
const KANALLAR = ["TRT 1", "KANAL D", "SHOW TV", "ATV", "NTV", "TV8", "STAR", "FOX"];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function yuvarlak(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function SahneKaydirma() {
  const bolum = useRef<HTMLElement>(null);
  const tuval = useRef<HTMLCanvasElement>(null);
  const yazi = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sec = bolum.current;
    const canvas = tuval.current;
    const txt = yazi.current;
    if (!sec || !canvas || !txt) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const vid = sec.querySelector("video");

    let w = 0;
    let h = 0;
    let raf = 0;
    const azalt = window.matchMedia("(prefers-reduced-motion: reduce)");

    const boyut = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ilerleme = () => {
      const r = sec.getBoundingClientRect();
      const menzil = sec.offsetHeight - h;
      return menzil <= 0 ? 0 : clamp(-r.top / menzil);
    };

    const ciz = (p: number) => {
      if (vid && Number.isFinite(vid.duration)) {
        const t = p * vid.duration;
        if (Math.abs(vid.currentTime - t) > 0.03) vid.currentTime = t;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(13, 43, 51, 0.55)";
      ctx.fillRect(0, 0, w, h);

      // 1. test kalıbı: aşağıdan yükselir, sonra solar
      const girRaw = clamp(p / 0.3);
      const gir = ease(girRaw);
      const solma1 = 1 - clamp((p - 0.36) / 0.14);
      ctx.globalAlpha = gir * solma1;
      const bw = w / TEST.length;
      const kayma = (p * bw * 4) % bw;
      TEST.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(i * bw - kayma, h * 0.5 - (1 - gir) * h * 0.3, bw + 2, h * 0.5);
      });

      // 2. kanal ızgarası: kayarak girer
      const izgara = clamp((p - 0.36) / 0.22) * (1 - clamp((p - 0.82) / 0.12));
      if (izgara > 0) {
        const kolon = w > 768 ? 4 : 2;
        const satir = Math.ceil(KANALLAR.length / kolon);
        const kart = Math.min(230, (w - 80) / kolon - 16);
        const yukseklik = kart * 0.62;
        const sol = (w - kolon * (kart + 16)) / 2;
        const ust = (h - satir * (yukseklik + 16)) / 2 + (1 - ease(clamp((p - 0.36) / 0.28))) * 70;
        ctx.globalAlpha = izgara;
        KANALLAR.forEach((ad, i) => {
          const x = sol + (i % kolon) * (kart + 16);
          const y = ust + Math.floor(i / kolon) * (yukseklik + 16);
          ctx.fillStyle = SURFACE;
          yuvarlak(ctx, x, y, kart, yukseklik, 12);
          ctx.fill();
          ctx.strokeStyle = BORDER;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = MUTED;
          ctx.font = "500 13px 'IBM Plex Sans', system-ui, sans-serif";
          ctx.fillText(`${String(i + 1).padStart(2, "0")}`, x + 16, y + 26);
          ctx.fillStyle = TEXT;
          ctx.font = "600 22px 'Barlow Condensed', system-ui, sans-serif";
          ctx.fillText(ad, x + 16, y + yukseklik - 18);
          ctx.fillStyle = ACCENT;
          ctx.beginPath();
          ctx.arc(x + kart - 22, y + 22, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.globalAlpha = 1;

      // 3. başlık katmanı (DOM): saydam ve yukarı süzülür
      const yaz = clamp((p - 0.7) / 0.2);
      txt.style.opacity = String(yaz);
      txt.style.transform = `translateY(${(1 - yaz) * 24}px)`;
    };

    const guncelle = () => {
      raf = 0;
      ciz(ilerleme());
    };
    const planla = () => {
      if (!raf) raf = requestAnimationFrame(guncelle);
    };

    const basla = () => {
      boyut();
      if (azalt.matches) {
        sec.querySelector("video")?.pause();
        ciz(1);
        txt.style.opacity = "1";
        txt.style.transform = "none";
        return;
      }
      ciz(ilerleme());
      window.addEventListener("scroll", planla, { passive: true });
      window.addEventListener("resize", yenidenBoyut);
    };
    const yenidenBoyut = () => {
      boyut();
      planla();
    };

    basla();
    vid?.addEventListener("loadeddata", planla);
    return () => {
      vid?.removeEventListener("loadeddata", planla);
      window.removeEventListener("scroll", planla);
      window.removeEventListener("resize", yenidenBoyut);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={bolum} aria-label="Kanal geçişi" className="relative h-[260vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <video
          src="/sahne-arka-plan.mp4"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain bg-[var(--bg)]"
        />
        <canvas ref={tuval} aria-hidden="true" className="absolute inset-0" />
        <div
          ref={yazi}
          className="absolute inset-x-0 bottom-[12%] mx-auto max-w-6xl px-6 opacity-0"
        >
          <h2 className="text-5xl md:text-7xl">Tek ekranda, tüm kanallar.</h2>
          <p className="mt-4 max-w-[40ch] text-[var(--muted)]">
            Kanalları sırayla gezin, bir dokunuşla izlemeye geçin.
          </p>
        </div>
      </div>
    </section>
  );
}
