"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const OZELLIKLER = [
  { baslik: "Paketinize özel kanallar", metin: "Seçtiğiniz paketin kanal listesine göre canlı yayınları izleyin." },
  { baslik: "Aynı anda birden fazla cihaz", metin: "Paketinizdeki cihaz sınırına kadar aynı anda izleyin." },
  { baslik: "Favoriler ve son izlenenler", metin: "En sevdiğiniz kanallara bir dokunuşla dönün." },
  { baslik: "Kesintisiz yayın", metin: "Yayın kopmalarında otomatik yeniden bağlanma ve açık hata bildirimi." },
];

export default function Features() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      // Kartlar CSS ile görünür kalır; animasyon yalnızca bölüm ekrana gelince oynar.
      gsap.fromTo(
        "[data-feature]",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power2.out",
          stagger: 0.15,
          immediateRender: false,
          scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="mx-auto max-w-6xl px-6 py-32">
      <h2 className="text-3xl font-semibold md:text-4xl">Neden bu platform?</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {OZELLIKLER.map((o) => (
          <div
            key={o.baslik}
            data-feature
            className="rounded-2xl border border-[var(--border)] bg-white/5 p-8  transition  hover:border-[var(--accent)]"
          >
            <h3 className="text-xl font-medium">{o.baslik}</h3>
            <p className="mt-3 text-[var(--muted)]">{o.metin}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
