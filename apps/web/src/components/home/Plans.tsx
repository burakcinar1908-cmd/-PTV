"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Sure = { ay: number; fiyat: number };
type Paket = { id: string; ad: string; cihazSiniri: number; sureSecenekleri: Sure[]; ozellikler: string[] };

function sureAdi(ay: number): string {
  if (ay === 1) return "1 aylık";
  if (ay === 3) return "3 aylık";
  if (ay === 12) return "Yıllık";
  return `${ay} aylık`;
}

export default function Plans() {
  const [paketler, setPaketler] = useState<Paket[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yukleHata, setYukleHata] = useState<string | null>(null);
  const [girisli, setGirisli] = useState<boolean | null>(null);
  const [secilenAy, setSecilenAy] = useState<Record<string, number>>({});
  const [mesaj, setMesaj] = useState<{ tur: "hata" | "basari"; metin: string } | null>(null);
  const [islem, setIslem] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setYukleHata(null);
    const s = await api<{ paketler: Paket[] }>("/paketler", undefined, "GET");
    if (s.ok) setPaketler(s.veri.paketler);
    else setYukleHata(s.mesaj);
    setYukleniyor(false);
  }, []);

  useEffect(() => {
    yukle();
    api("/auth/ben", undefined, "GET").then((s) => setGirisli(s.ok));
  }, [yukle]);

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
    <section id="paketler" className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-4xl md:text-5xl">Abonelik paketleri</h2>
        <p className="mt-3 max-w-[60ch] text-[var(--muted)]">
          Şu an demo sürümündesiniz. Tüm paketler ücretsiz ve ödeme alınmadan etkinleşir.
        </p>

        {mesaj && (
          <p
            role="alert"
            className={`mt-6 rounded-xl border px-4 py-3 ${
              mesaj.tur === "hata"
                ? "border-[var(--danger)] text-[var(--danger)]"
                : "border-[var(--ok)] bg-[var(--ok-bg)] text-[var(--ok)]"
            }`}
          >
            {mesaj.metin}
          </p>
        )}

        {yukleHata && (
          <div role="alert" className="mt-8 rounded-xl border border-[var(--danger)] p-5">
            <p className="text-[var(--danger)]">Paketler yüklenemedi. {yukleHata}</p>
            <button type="button" onClick={yukle} className="btn-secondary mt-4">
              Yeniden dene
            </button>
          </div>
        )}

        {yukleniyor && !yukleHata && (
          <div aria-hidden="true" className="mt-10 grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-96 rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {paketler.map((p) => {
            const ay = aySec(p);
            const sure = p.sureSecenekleri.find((s) => s.ay === ay);
            return (
              <article key={p.id} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h3 className="text-3xl">{p.ad}</h3>
                <p className="mt-1 text-[0.9375rem] text-[var(--muted)]">{p.cihazSiniri} cihazda aynı anda izleme</p>

                <div role="group" aria-label={`${p.ad} süre seçimi`} className="mt-5 flex flex-wrap gap-2">
                  {p.sureSecenekleri.map((s) => (
                    <button
                      key={s.ay}
                      type="button"
                      aria-pressed={ay === s.ay}
                      onClick={() => setSecilenAy({ ...secilenAy, [p.id]: s.ay })}
                      className={`inline-flex min-h-[44px] items-center rounded-lg border px-4 text-[0.9375rem] transition-colors duration-150 ${
                        ay === s.ay
                          ? "border-[var(--accent)] bg-[var(--accent)] font-medium text-[var(--accent-ink)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {sureAdi(s.ay)}
                    </button>
                  ))}
                </div>

                <p className="mt-6 font-display text-5xl font-semibold tabular-nums">
                  {!sure || sure.fiyat === 0 ? "Ücretsiz" : `₺${sure.fiyat}`}
                  <span className="ml-2 font-sans text-base font-normal text-[var(--muted)]">/ {ay} ay</span>
                </p>

                <ul className="mt-6 flex-1">
                  {p.ozellikler.map((o) => (
                    <li key={o} className="border-t border-[var(--border)] py-3 text-[var(--muted)]">
                      {o}
                    </li>
                  ))}
                </ul>

                {girisli ? (
                  <button
                    type="button"
                    onClick={() => sec(p)}
                    disabled={islem !== null}
                    aria-busy={islem === p.id}
                    className="btn-primary mt-8 w-full"
                  >
                    {islem === p.id ? "Etkinleştiriliyor…" : "Paketi etkinleştir"}
                  </button>
                ) : (
                  <a href="/giris" className="btn-primary mt-8 w-full">
                    Giriş yap ve paketi seç
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
