"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

const KAYDIRMA = "flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]";

function Cip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 text-[0.9375rem] transition-colors duration-150 ${
        aktif
          ? "border-[var(--accent)] bg-[var(--accent)] font-medium text-[var(--accent-ink)]"
          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}

const KARTLAR = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

function Iskelet() {
  return (
    <ul aria-hidden="true" className={KARTLAR}>
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="aspect-video bg-[var(--bg)]" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-[var(--raised)]" />
            <div className="h-4 w-3/4 rounded bg-[var(--raised)]" />
          </div>
        </li>
      ))}
    </ul>
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
  const filtreVar = Boolean(arama.trim() || grup || kategori);

  function temizle() {
    setArama("");
    setGrup("");
    setKategori("");
  }

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
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-12">
      <h1 className="text-5xl md:text-6xl">Kanallar</h1>
      <p className="mt-2 max-w-[60ch] text-[var(--muted)]">Kategoriye göre göz atın ya da kanal adıyla arayın.</p>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="kanal-ara" className="mb-2 block text-[0.9375rem] text-[var(--muted)]">
            Kanal ara
          </label>
          <div className="relative">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="kanal-ara"
              type="search"
              placeholder="Örnek: BEIN"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="min-h-[48px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-11 pr-12 text-base placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
            {arama && (
              <button
                type="button"
                onClick={() => setArama("")}
                aria-label="Aramayı temizle"
                className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--text)]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div>
          <p id="grup-etiketi" className="mb-2 text-[0.9375rem] text-[var(--muted)]">
            Ülke veya grup
          </p>
          <div role="group" aria-labelledby="grup-etiketi" className={KAYDIRMA}>
            <Cip aktif={!grup} onClick={() => { setGrup(""); setKategori(""); }}>
              Tümü
            </Cip>
            {gruplar.adlar.map((g) => (
              <Cip key={g} aktif={grup === g} onClick={() => { setGrup(g); setKategori(""); }}>
                {g}
                <span className="text-sm tabular-nums opacity-70">{gruplar.harita.get(g)?.length}</span>
              </Cip>
            ))}
          </div>
        </div>

        {grup && altKategoriler.length > 0 && (
          <div>
            <p id="alt-etiketi" className="mb-2 text-[0.9375rem] text-[var(--muted)]">
              {grup} kategorileri
            </p>
            <div role="group" aria-labelledby="alt-etiketi" className={KAYDIRMA}>
              <Cip aktif={!kategori} onClick={() => setKategori("")}>
                Hepsi
              </Cip>
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
        <p role="status" className="mt-6 text-[var(--warning)]">
          {bilgi}{" "}
          <a href="/giris" className="underline underline-offset-4">
            Giriş yap
          </a>
        </p>
      )}

      {sonIzlenen.length > 0 && !arama && !kategori && !grup && !tumKilitli && (
        <section className="mt-10" aria-labelledby="son-izlenenler">
          <h2 id="son-izlenenler" className="mb-3 text-2xl">
            Son izlenenler
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {sonIzlenen.map((k) => (
              <a
                key={k.id}
                href={`/izle/${k.id}`}
                className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-[0.9375rem] transition-colors duration-150 hover:border-[var(--accent)]"
              >
                {k.ad}
              </a>
            ))}
          </div>
        </section>
      )}

      {(tumKilitli || kilitliKategoriler.length > 0) && (
        <div className="mt-8">
          <KilitAc kategoriler={kilitliKategoriler} tumu={tumKilitli} onAcildi={() => setYenile((n) => n + 1)} />
        </div>
      )}

      {paketGerekli && (
        <div className="mt-8 rounded-r-xl border-l-4 border-[var(--accent)] bg-[var(--surface)] p-6">
          <p className="text-lg">Kanalları görmek için bir paket seçin.</p>
          <p className="mt-1 text-[var(--muted)]">Her paket farklı bir kanal listesi sunar. Demo paketler ücretsizdir.</p>
          <a href="/#paketler" className="btn-primary mt-4">
            Paketleri incele
          </a>
        </div>
      )}

      <section className="mt-10" aria-busy={yukleniyor}>
        {!hata && (
          <p className="mb-4 text-[0.9375rem] tabular-nums text-[var(--muted)]" aria-live="polite">
            {yukleniyor && kanallar.length === 0
              ? "Kanallar yükleniyor"
              : `${kanallar.length} kanal${kategori ? `, ${grupAyir(kategori).alt}` : grup ? `, ${grup}` : ""}`}
          </p>
        )}

        {hata && (
          <div role="alert" className="rounded-xl border border-[var(--danger)] p-5">
            <p className="text-[var(--danger)]">Kanallar yüklenemedi. {hata}</p>
            <button type="button" onClick={() => setYenile((n) => n + 1)} className="btn-secondary mt-4">
              Yeniden dene
            </button>
          </div>
        )}

        {yukleniyor && !hata && kanallar.length === 0 && <Iskelet />}

        {!yukleniyor && !hata && !tumKilitli && !paketGerekli && kanallar.length === 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
            <h2 className="text-3xl">Eşleşen kanal yok</h2>
            <p className="mt-2 max-w-[60ch] text-[var(--muted)]">Farklı bir ad deneyin ya da filtreleri sıfırlayıp tüm kanallara dönün.</p>
            {filtreVar && (
              <button type="button" onClick={temizle} className="btn-primary mt-5">
                Filtreleri temizle
              </button>
            )}
          </div>
        )}

        {kanallar.length > 0 && (
          <ul className={`${KARTLAR} ${yukleniyor ? "opacity-60" : ""} transition-opacity duration-150`}>
            {kanallar.map((kanal) => (
              <li key={kanal.id}>
                <KanalKarti
                  kanal={kanal}
                  favori={favoriler === null ? null : favoriler.has(kanal.id)}
                  onFavori={() => favoriDegistir(kanal.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
