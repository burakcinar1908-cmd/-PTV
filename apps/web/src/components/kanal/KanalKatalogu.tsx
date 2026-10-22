"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { sonIzlenenleriOku, type Kanal } from "@/lib/kanal";
import KanalKarti from "./KanalKarti";
import KilitAc from "./KilitAc";

type Liste = { kanallar: Kanal[]; kategoriler: string[]; paketGerekli: boolean; kilitliKategoriler: string[]; tumKilitli?: boolean };

// "AR | BAHRAIN", "TR ✦ SPOR" gibi adlarda baştaki ülke/grup kodunu ayırır.
const AYIRAC = /^\s*([^\s|✦✪★•:–-]{1,10})\s*(?:\||✦|✪|★|•|:|–|-)\s*(.*)$/u;

function grupAyir(ad: string): { grup: string; alt: string } {
  const e = AYIRAC.exec(ad);
  if (!e) return { grup: "Diğer", alt: ad.trim() };
  return { grup: e[1].toLocaleUpperCase("tr"), alt: e[2].trim() || ad.trim() };
}

const kaydirmaSatiri =
  "flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]";

function Cip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
        aktif
          ? "bg-[var(--accent)] font-medium text-[var(--accent-ink)] "
          : "bg-white/5 text-[var(--muted)] ring-1 ring-white/10 hover:bg-white/10 hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function KanalKatalogu() {
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [kanallar, setKanallar] = useState<Kanal[]>([]);
  const [kategori, setKategori] = useState("");
  const [grup, setGrup] = useState("");
  const kategorilerRef = useRef<string[]>([]);
  const [arama, setArama] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  // null: giriş yok, Set: favori kimlikleri
  const [favoriler, setFavoriler] = useState<Set<string> | null>(null);
  const [sonIzlenen, setSonIzlenen] = useState<Kanal[]>([]);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [paketGerekli, setPaketGerekli] = useState(false);
  const [kilitliKategoriler, setKilitliKategoriler] = useState<string[]>([]);
  const [tumKilitli, setTumKilitli] = useState(false);
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
      if (kategori) params.append("kategori", kategori);
      else if (grup) {
        for (const k of kategorilerRef.current) if (grupAyir(k).grup === grup) params.append("kategori", k);
      }
      if (arama.trim()) params.set("q", arama.trim());
      const sonuc = await api<Liste>(`/kanallar?${params.toString()}`, undefined, "GET");
      setYukleniyor(false);
      if (sonuc.ok) {
        setKanallar(sonuc.veri.kanallar);
        setPaketGerekli(sonuc.veri.paketGerekli);
        setKilitliKategoriler(sonuc.veri.kilitliKategoriler ?? []);
        setTumKilitli(Boolean(sonuc.veri.tumKilitli));
        kategorilerRef.current = sonuc.veri.kategoriler;
        setKategoriler(sonuc.veri.kategoriler);
        setHata(null);
      } else {
        setHata(sonuc.mesaj);
      }
    }, 250);
    return () => clearTimeout(zamanlayici);
  }, [kategori, grup, arama, yenile]);

  const gruplar = useMemo(() => {
    const harita = new Map<string, string[]>();
    for (const k of kategoriler) {
      const { grup: g } = grupAyir(k);
      harita.set(g, [...(harita.get(g) ?? []), k]);
    }
    const adlar = [...harita.keys()].sort((a, b) => {
      if (a === "TR") return -1;
      if (b === "TR") return 1;
      if (a === "Diğer") return 1;
      if (b === "Diğer") return -1;
      return a.localeCompare(b, "tr");
    });
    return { harita, adlar };
  }, [kategoriler]);

  const altKategoriler = grup ? (gruplar.harita.get(grup) ?? []) : [];

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
      <p className="mt-2 text-[var(--muted)]">Kategoriye göre göz atın veya kanal adıyla arayın.</p>

      <div className="mt-8 space-y-3">
        <div className="relative">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Kanal ara..."
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-white/5 py-3 pl-11 pr-11 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white/10"
          />
          {arama && (
            <button
              type="button"
              onClick={() => setArama("")}
              aria-label="Aramayı temizle"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[var(--muted)] hover:text-[var(--text)]"
            >
              ✕
            </button>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-[var(--muted)]">Ülke / Grup</p>
          <div className={kaydirmaSatiri}>
            <Cip aktif={!grup} onClick={() => { setGrup(""); setKategori(""); }}>Tümü</Cip>
            {gruplar.adlar.map((g) => (
              <Cip key={g} aktif={grup === g} onClick={() => { setGrup(g); setKategori(""); }}>
                {g} <span className="ml-1 text-xs opacity-60">{gruplar.harita.get(g)?.length}</span>
              </Cip>
            ))}
          </div>
        </div>

        {grup && altKategoriler.length > 0 && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-[var(--muted)]">{grup} kategorileri</p>
            <div className={kaydirmaSatiri}>
              <Cip aktif={!kategori} onClick={() => setKategori("")}>Hepsi</Cip>
              {altKategoriler.map((k) => (
                <Cip key={k} aktif={kategori === k} onClick={() => setKategori(k)}>
                  {grupAyir(k).alt}
                </Cip>
              ))}
            </div>
          </div>
        )}
      </div>

      {bilgi && (
        <p className="mt-4 text-sm text-[var(--warning)]">
          {bilgi} <a href="/giris" className="underline">Giriş yap</a>
        </p>
      )}

      {sonIzlenen.length > 0 && !arama && !kategori && !grup && !tumKilitli && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-medium text-[var(--muted)]">Son izlenenler</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {sonIzlenen.map((k) => (
              <a key={k.id} href={`/izle/${k.id}`} className="shrink-0 rounded-xl border border-[var(--border)] bg-white/5 px-5 py-3 text-sm hover:border-[var(--accent)]">
                {k.ad}
              </a>
            ))}
          </div>
        </section>
      )}

      {(tumKilitli || kilitliKategoriler.length > 0) && (
        <KilitAc kategoriler={kilitliKategoriler} tumu={tumKilitli} onAcildi={() => setYenile((n) => n + 1)} />
      )}

      {paketGerekli && (
        <div className="mt-10 rounded-2xl border border-[var(--accent)] bg-[var(--accent)] p-6">
          <p className="text-lg text-[var(--text)]">Kanalları görmek için bir paket seçin.</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Her paket farklı bir kanal listesi sunar. Demo paketler ücretsizdir.</p>
          <a href="/#paketler" className="mt-4 inline-block rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--accent-ink)] hover:bg-[var(--accent)]">Paketlere bak</a>
        </div>
      )}

      <section className="mt-10">
        {!yukleniyor && !hata && kanallar.length > 0 && (
          <p className="mb-4 text-xs uppercase tracking-widest text-[var(--muted)]">
            {kanallar.length} kanal{kategori ? ` · ${kategori}` : grup ? ` · ${grup}` : ""}
          </p>
        )}
        {hata && <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-[var(--danger)]">{hata}</p>}
        {yukleniyor && !hata && <p className="text-[var(--muted)]">Kanallar yükleniyor...</p>}
        {!yukleniyor && !hata && !tumKilitli && kanallar.length === 0 && (
          <p className="text-[var(--muted)]">Aramanızla eşleşen kanal bulunamadı.</p>
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
