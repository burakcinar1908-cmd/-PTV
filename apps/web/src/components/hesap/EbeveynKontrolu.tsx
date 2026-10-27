"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";

type Durum = { aktif: boolean; kategoriler: string[]; tumKanallar: boolean };

const INPUT = "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const BUTON = "rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)] hover:bg-[var(--accent)] disabled:opacity-60";

export default function EbeveynKontrolu() {
  const [durum, setDurum] = useState<Durum | null>(null);
  const [tumKategoriler, setTumKategoriler] = useState<string[]>([]);
  const [duzenle, setDuzenle] = useState(false);
  const [mevcutPin, setMevcutPin] = useState("");
  const [yeniPin, setYeniPin] = useState("");
  const [secilen, setSecilen] = useState<string[]>([]);
  const [tumKanallar, setTumKanallar] = useState(false);
  const [bilgi, setBilgi] = useState<{ tur: "hata" | "basari"; metin: string } | null>(null);
  const [islem, setIslem] = useState(false);

  async function yukle() {
    const [d, k] = await Promise.all([
      api<Durum>("/hesap/ebeveyn", undefined, "GET"),
      api<{ kategoriler: string[] }>("/hesap/kategoriler", undefined, "GET"),
    ]);
    if (d.ok) {
      setDurum(d.veri);
      setSecilen(d.veri.kategoriler);
      setTumKanallar(Boolean(d.veri.tumKanallar));
    }
    if (k.ok) setTumKategoriler(k.veri.kategoriler);
  }

  useEffect(() => {
    yukle();
  }, []);

  function kategoriDegistir(k: string) {
    setSecilen(secilen.includes(k) ? secilen.filter((x) => x !== k) : [...secilen, k]);
  }

  async function kaydet(e: FormEvent) {
    e.preventDefault();
    setIslem(true);
    setBilgi(null);
    const sonuc = await api<{ mesaj: string }>("/hesap/ebeveyn", {
      mevcutPin: durum?.aktif ? mevcutPin : undefined,
      yeniPin,
      kategoriler: secilen,
      tumKanallar,
    }, "PUT");
    setIslem(false);
    if (sonuc.ok) {
      setBilgi({ tur: "basari", metin: sonuc.veri.mesaj });
      setMevcutPin("");
      setYeniPin("");
      setDuzenle(false);
      yukle();
    } else {
      setBilgi({ tur: "hata", metin: sonuc.mesaj });
    }
  }

  async function kapat() {
    const pin = window.prompt("Ebeveyn kontrolünü kapatmak için PIN'inizi girin");
    if (!pin) return;
    setIslem(true);
    const sonuc = await api<{ mesaj: string }>("/hesap/ebeveyn", { pin }, "DELETE");
    setIslem(false);
    setBilgi(sonuc.ok ? { tur: "basari", metin: sonuc.veri.mesaj } : { tur: "hata", metin: sonuc.mesaj });
    yukle();
  }

  if (!durum) return <p className="text-[var(--muted)]">Ebeveyn ayarları yükleniyor...</p>;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white/5 p-6">
      <h2 className="text-lg font-medium">Ebeveyn kontrolü</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Seçtiğiniz kategoriler ya da isterseniz tüm kanallar PIN girilmeden görünmez. Kilit açıldığında 30 dakika boyunca açık kalır.
      </p>

      {bilgi && (
        <p role="alert" className={`mt-4 rounded-lg px-3 py-2 text-sm ${bilgi.tur === "hata" ? "bg-rose-500/10 text-[var(--danger)]" : "bg-[var(--ok-bg)] text-[var(--ok)]"}`}>
          {bilgi.metin}
        </p>
      )}

      {!duzenle && (
        <div className="mt-4 space-y-4">
          <p className="text-sm">
            Durum: <span className={durum.aktif ? "text-[var(--accent)]" : "text-[var(--muted)]"}>{durum.aktif ? "Açık" : "Kapalı"}</span>
            {durum.aktif && durum.tumKanallar && <> · Tüm kanallar gizli</>}
            {durum.aktif && !durum.tumKanallar && durum.kategoriler.length > 0 && <> · Kilitli: {durum.kategoriler.join(", ")}</>}
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setDuzenle(true)} className={BUTON}>
              {durum.aktif ? "Ayarları değiştir" : "Ebeveyn kontrolünü aç"}
            </button>
            {durum.aktif && (
              <button type="button" disabled={islem} onClick={kapat} className="rounded-full border border-white/20 px-4 py-2 text-sm text-[var(--text)] hover:bg-white/10">
                Kapat
              </button>
            )}
          </div>
        </div>
      )}

      {duzenle && (
        <form onSubmit={kaydet} className="mt-4 space-y-4">
          {durum.aktif && (
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--muted)]">Mevcut PIN</span>
              <input required inputMode="numeric" pattern="\d{4,6}" value={mevcutPin} onChange={(e) => setMevcutPin(e.target.value)} className={INPUT} />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--muted)]">Yeni PIN (4 ila 6 rakam)</span>
            <input required inputMode="numeric" pattern="\d{4,6}" value={yeniPin} onChange={(e) => setYeniPin(e.target.value)} className={INPUT} />
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-white/5 p-3 text-sm text-[var(--text)]">
            <input type="checkbox" checked={tumKanallar} onChange={(e) => setTumKanallar(e.target.checked)} className="mt-1" />
            <span>
              Tüm kanalları gizle
              <span className="block text-xs text-[var(--muted)]">Açıkken PIN girilene kadar hiçbir kanal listelenmez ve izlenemez. Aşağıdaki kategori seçimi bu durumda kullanılmaz.</span>
            </span>
          </label>
          <div className={tumKanallar ? "pointer-events-none opacity-40" : ""}>
            <span className="mb-2 block text-xs text-[var(--muted)]">Kilitlenecek kategoriler</span>
            <div className="flex flex-wrap gap-2">
              {tumKategoriler.length === 0 && <p className="text-xs text-[var(--muted)]">Henüz kategori yok.</p>}
              {tumKategoriler.map((k) => (
                <button key={k} type="button" onClick={() => kategoriDegistir(k)} className={`rounded-full px-3 py-1.5 text-xs transition ${secilen.includes(k) ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-white/5 text-[var(--muted)] hover:bg-white/10"}`}>
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={islem} className={BUTON}>Kaydet</button>
            <button type="button" onClick={() => setDuzenle(false)} className="rounded-full border border-white/20 px-4 py-2 text-sm text-[var(--text)] hover:bg-white/10">Vazgeç</button>
          </div>
        </form>
      )}
    </section>
  );
}
