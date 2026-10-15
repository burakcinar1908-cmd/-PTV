"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { sonIzlenenleriOku, type Kanal } from "@/lib/kanal";
import KanalKarti from "./KanalKarti";
import KilitAc from "./KilitAc";

type Liste = { kanallar: Kanal[]; kategoriler: string[]; paketGerekli: boolean; kilitliKategoriler: string[] };

export default function KanalKatalogu() {
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [kanallar, setKanallar] = useState<Kanal[]>([]);
  const [kategori, setKategori] = useState("");
  const [arama, setArama] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  // null: giriş yok, Set: favori kimlikleri
  const [favoriler, setFavoriler] = useState<Set<string> | null>(null);
  const [sonIzlenen, setSonIzlenen] = useState<Kanal[]>([]);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [paketGerekli, setPaketGerekli] = useState(false);
  const [kilitliKategoriler, setKilitliKategoriler] = useState<string[]>([]);
  const [yenile, setYenile] = useState(0);

  useEffect(() => {
    setSonIzlenen(sonIzlenenleriOku());
    api<{ idler: string[] }>("/kanallar/favoriler", undefined, "GET").then((s) => {
      setFavoriler(s.ok ? new Set(s.veri.idler) : null);
    });
  }, []);

  useEffect(() => {
    const zamanlayici = setTimeout(async () => {
      setYukleniyor(true);
      const params = new URLSearchParams();
      if (kategori) params.set("kategori", kategori);
      if (arama.trim()) params.set("q", arama.trim());
      const sonuc = await api<Liste>(`/kanallar?${params.toString()}`, undefined, "GET");
      setYukleniyor(false);
      if (sonuc.ok) {
        setKanallar(sonuc.veri.kanallar);
        setPaketGerekli(sonuc.veri.paketGerekli);
        setKilitliKategoriler(sonuc.veri.kilitliKategoriler ?? []);
        setKategoriler(sonuc.veri.kategoriler);
        setHata(null);
      } else {
        setHata(sonuc.mesaj);
      }
    }, 250);
    return () => clearTimeout(zamanlayici);
  }, [kategori, arama, yenile]);

  async function favoriDegistir(kanalId: string) {
    if (!favoriler) {
      setBilgi("Favori eklemek için giriş yapmanız gerekir.");
      return;
    }
    const eklemeli = !favoriler.has(kanalId);
    const sonuc = await api(`/kanallar/favoriler/${kanalId}`, undefined, eklemeli ? "POST" : "DELETE");
    if (!sonuc.ok) {
      setBilgi(sonuc.mesaj);
      return;
    }
    const yeni = new Set(favoriler);
    if (eklemeli) yeni.add(kanalId);
    else yeni.delete(kanalId);
    setFavoriler(yeni);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <h1 className="text-4xl font-semibold">Kanallar</h1>
      <p className="mt-2 text-slate-400">Kategoriye göre göz atın veya kanal adıyla arayın.</p>

      <div className="mt-8 space-y-4">
        <div className="relative">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Kanal ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/10"
          />
          {arama && (
            <button
              type="button"
              onClick={() => setArama("")}
              aria-label="Aramayı temizle"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-slate-400 hover:text-slate-100"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[""].concat(kategoriler).map((k) => {
            const aktif = kategori === k;
            return (
              <button
                key={k || "tumu"}
                type="button"
                onClick={() => setKategori(k)}
                className={`shrink-0 snap-start rounded-full px-4 py-1.5 text-sm transition ${
                  aktif
                    ? "bg-cyan-400 font-medium text-slate-950"
                    : "bg-white/5 text-slate-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-slate-100"
                }`}
              >
                {k || "Tümü"}
              </button>
            );
          })}
        </div>
      </div>

      {bilgi && (
        <p className="mt-4 text-sm text-amber-300">
          {bilgi} <a href="/giris" className="underline">Giriş yap</a>
        </p>
      )}

      {sonIzlenen.length > 0 && !arama && !kategori && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-medium text-slate-300">Son izlenenler</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {sonIzlenen.map((k) => (
              <a key={k.id} href={`/izle/${k.id}`} className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm hover:border-cyan-300/40">
                {k.ad}
              </a>
            ))}
          </div>
        </section>
      )}

      {kilitliKategoriler.length > 0 && (
        <KilitAc kategoriler={kilitliKategoriler} onAcildi={() => setYenile((n) => n + 1)} />
      )}

      {paketGerekli && (
        <div className="mt-10 rounded-2xl border border-cyan-300/30 bg-cyan-400/5 p-6">
          <p className="text-lg text-slate-100">Kanalları görmek için bir paket seçin.</p>
          <p className="mt-1 text-sm text-slate-400">Her paket farklı bir kanal listesi sunar. Demo paketler ücretsizdir.</p>
          <a href="/#paketler" className="mt-4 inline-block rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300">Paketlere bak</a>
        </div>
      )}

      <section className="mt-10">
        {!yukleniyor && !hata && kanallar.length > 0 && (
          <p className="mb-4 text-xs uppercase tracking-widest text-slate-500">
            {kanallar.length} kanal{kategori ? ` · ${kategori}` : ""}
          </p>
        )}
        {hata && <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{hata}</p>}
        {yukleniyor && !hata && <p className="text-slate-400">Kanallar yükleniyor...</p>}
        {!yukleniyor && !hata && kanallar.length === 0 && (
          <p className="text-slate-400">Aramanızla eşleşen kanal bulunamadı.</p>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kanallar.map((kanal) => (
            <KanalKarti
              key={kanal.id}
              kanal={kanal}
              favori={favoriler === null ? null : favoriler.has(kanal.id)}
              onFavori={() => favoriDegistir(kanal.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
