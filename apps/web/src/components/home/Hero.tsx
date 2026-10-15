"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import HeroSceneLoader from "@/components/scene/HeroSceneLoader";

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-item]", {
        y: 40,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.12,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative flex min-h-screen items-center overflow-hidden"
    >
      <HeroSceneLoader />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060a] via-transparent to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <p data-hero-item className="mb-4 text-sm tracking-[0.3em] text-cyan-300/80">
          TÜRKİYE'NİN CANLI YAYIN PLATFORMU
        </p>
        <h1 data-hero-item className="max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">
          Sevdiğiniz kanallar,
          <span className="block bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            tek ekranda.
          </span>
        </h1>
        <p data-hero-item className="mt-6 max-w-xl text-lg text-slate-300">
          Kategorilere göre kanal listeleme, elektronik program rehberi ve
          kesintisiz HD izleme deneyimi. Hemen başlayın.
        </p>
        <div data-hero-item className="mt-10 flex flex-wrap gap-4">
          <a
            href="/kayit"
            className="rounded-full bg-cyan-400 px-7 py-3 font-medium text-slate-950 transition hover:scale-105 hover:bg-cyan-300"
          >
            Ücretsiz Dene
          </a>
          <a
            href="#paketler"
            className="rounded-full border border-white/20 bg-white/5 px-7 py-3 backdrop-blur transition hover:bg-white/10"
          >
            Paketleri İncele
          </a>
        </div>
      </div>
    </section>
  );
}
