"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Sure = { ay: number; fiyat: number };
type Paket = { id: string; ad: string; cihazSiniri: number; sureSecenekleri: Sure[]; ozellikler: string[] };

function sureAdi(ay: number): string {
  if (ay === 1) return "1 Aylık";
  if (ay === 3) return "3 Aylık";
  if (ay === 12) return "Yıllık (12 ay)";
  return `${ay} Aylık`;
}

export default function Plans() {
  const [paketler, setPaketler] = useState<Paket[]>([]);
  const [girisli, setGirisli] = useState<boolean | null>(null);
  const [secilenAy, setSecilenAy] = useState<Record<string, number>>({});
  const [mesaj, setMesaj] = useState<{ tur: "hata" | "basari"; metin: string } | null>(null);
  const [islem, setIslem] = useState<string | null>(null);

  useEffect(() => {
    api<{ paketler: Paket[] }>("/paketler", undefined, "GET").then((s) => {
      if (s.ok) setPaketler(s.veri.paketler);
    });
    api("/auth/ben", undefined, "GET").then((s) => setGirisli(s.ok));
  }, []);

  function aySec(paket: Paket): number {
    return secilenAy[paket.id] ?? paket.sureSecenekleri[0]?.ay ?? 1;
  }

  async function sec(paket: Paket) {
    setMesaj(null);
    setIslem(paket.id);
    const sonuc = await api<{ mesaj: string }>(`/paketler/${paket.id}/demo-satin-al`, { ay: aySec(paket) });
    setIslem(null);
    setMesaj(sonuc.ok ? { tur: "basari", metin: sonuc.veri.mesaj } : { tur: "hata", metin: sonuc.mesaj });
  }

  return (
    <section id="paketler" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-3xl font-semibold md:text-4xl">Abonelik paketleri</h2>
      <p className="mt-3 text-[var(--muted)]">Şu an demo sürümdesiniz. Tüm paketler ücretsiz ve ödeme alınmadan etkinleşir.</p>

      {mesaj && (
        <p role="alert" className={`mt-6 rounded-xl border px-4 py-3 text-sm ${mesaj.tur === "hata" ? "border-rose-400/40 bg-rose-500/10 text-[var(--danger)]" : "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent)]"}`}>
          {mesaj.metin}
        </p>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {paketler.map((p) => {
          const ay = aySec(p);
          const sure = p.sureSecenekleri.find((s) => s.ay === ay);
          return (
            <div key={p.id} className="flex flex-col rounded-2xl border border-[var(--border)] bg-white/5 p-8 ">
              <h3 className="text-xl font-medium">{p.ad}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{p.cihazSiniri} cihazda aynı anda izleme</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {p.sureSecenekleri.map((s) => (
                  <button
                    key={s.ay}
                    type="button"
                    onClick={() => setSecilenAy({ ...secilenAy, [p.id]: s.ay })}
                    className={`rounded-full px-3 py-1.5 text-xs transition ${ay === s.ay ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-white/5 text-[var(--muted)] hover:bg-white/10"}`}
                  >
                    {sureAdi(s.ay)}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-3xl font-semibold">
                {!sure || sure.fiyat === 0 ? "Ücretsiz" : `₺${sure.fiyat}`}
                <span className="text-base text-[var(--muted)]"> / {ay} ay</span>
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-[var(--muted)]">
                {p.ozellikler.map((o) => (
                  <li key={o}>• {o}</li>
                ))}
              </ul>

              {girisli ? (
                <button
                  type="button"
                  onClick={() => sec(p)}
                  disabled={islem !== null}
                  className="mt-8 w-full rounded-full bg-[var(--accent)] py-3 font-medium text-[var(--accent-ink)] hover:bg-[var(--accent)] disabled:opacity-60"
                >
                  {islem === p.id ? "Etkinleştiriliyor..." : "Demo olarak seç"}
                </button>
              ) : (
                <a href="/giris" className="mt-8 block rounded-full bg-[var(--accent)] py-3 text-center font-medium text-[var(--accent-ink)] hover:bg-[var(--accent)]">
                  Seçmek için giriş yapın
                </a>
              )}
            </div>
          );
        })}
      </div>
      {paketler.length === 0 && <p className="mt-8 text-[var(--muted)]">Paketler yükleniyor...</p>}
    </section>
  );
}
