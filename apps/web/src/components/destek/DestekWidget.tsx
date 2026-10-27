"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";

type Yanit = { kod: string; mesaj: string; yanit: string; yanitTarih: string | null; tarih: string };

const ANAHTAR = "destekKodlari";

function kodlariOku(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(ANAHTAR) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 20) : [];
  } catch {
    return [];
  }
}

function kodEkle(kod: string) {
  try {
    const yeni = [kod, ...kodlariOku().filter((k) => k !== kod)].slice(0, 20);
    localStorage.setItem(ANAHTAR, JSON.stringify(yeni));
  } catch {
    /* depolama kapalıysa sessizce geç */
  }
}

const girdiSinifi = "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";

export default function DestekWidget() {
  const [acik, setAcik] = useState(false);
  const [sekme, setSekme] = useState<"yeni" | "mesajlarim">("yeni");
  const [form, setForm] = useState({ ad: "", email: "", mesaj: "" });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [bilgi, setBilgi] = useState<{ tur: "hata" | "basari"; metin: string } | null>(null);
  const [mesajlar, setMesajlar] = useState<Yanit[]>([]);
  const [listeYukleniyor, setListeYukleniyor] = useState(false);
  const [okunmamis, setOkunmamis] = useState(0);

  const listeyiYenile = useCallback(async () => {
    const kodlar = kodlariOku();
    if (kodlar.length === 0) {
      setMesajlar([]);
      return;
    }
    setListeYukleniyor(true);
    const s = await api<{ mesajlar: Yanit[] }>("/destek/takip", { kodlar });
    setListeYukleniyor(false);
    if (!s.ok) return;
    setMesajlar(s.veri.mesajlar);
    let gorulen: string[] = [];
    try {
      gorulen = JSON.parse(localStorage.getItem("destekGorulen") ?? "[]");
    } catch {
      gorulen = [];
    }
    setOkunmamis(s.veri.mesajlar.filter((m) => m.yanit && !gorulen.includes(m.kod)).length);
  }, []);

  useEffect(() => {
    listeyiYenile();
  }, [listeyiYenile]);

  function mesajlarimaGec() {
    setSekme("mesajlarim");
    listeyiYenile().then(() => {
      try {
        localStorage.setItem("destekGorulen", JSON.stringify(mesajlar.filter((m) => m.yanit).map((m) => m.kod)));
      } catch {
        /* yok say */
      }
      setOkunmamis(0);
    });
  }

  async function gonder(e: FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setBilgi(null);
    const sonuc = await api<{ mesaj: string; takipKodu?: string }>("/destek", form);
    setYukleniyor(false);
    if (sonuc.ok) {
      if (sonuc.veri.takipKodu) kodEkle(sonuc.veri.takipKodu);
      setBilgi({ tur: "basari", metin: sonuc.veri.mesaj });
      setForm({ ad: form.ad, email: form.email, mesaj: "" });
      listeyiYenile();
    } else {
      setBilgi({ tur: "hata", metin: sonuc.mesaj });
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {acik && (
        <div className="flex max-h-[80vh] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5  ">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-medium">Destek</p>
              <p className="text-xs text-[var(--muted)]">Yönetim ekibinin yanıtı burada görünür.</p>
            </div>
            <button type="button" onClick={() => setAcik(false)} aria-label="Kapat" className="text-[var(--muted)] hover:text-white">✕</button>
          </div>

          <div className="mb-4 flex gap-1 rounded-full bg-white/5 p-1 text-xs">
            <button type="button" onClick={() => setSekme("yeni")} className={`flex-1 rounded-full py-1.5 transition ${sekme === "yeni" ? "bg-[var(--accent)] font-medium text-[var(--accent-ink)]" : "text-[var(--muted)] hover:text-white"}`}>
              Yeni mesaj
            </button>
            <button type="button" onClick={mesajlarimaGec} className={`relative flex-1 rounded-full py-1.5 transition ${sekme === "mesajlarim" ? "bg-[var(--accent)] font-medium text-[var(--accent-ink)]" : "text-[var(--muted)] hover:text-white"}`}>
              Mesajlarım
              {okunmamis > 0 && <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{okunmamis}</span>}
            </button>
          </div>

          {sekme === "yeni" && (
            <>
              {bilgi && (
                <p className={`mb-3 rounded-lg px-3 py-2 text-xs ${bilgi.tur === "hata" ? "bg-rose-500/10 text-[var(--danger)]" : "bg-[var(--ok-bg)] text-[var(--ok)]"}`}>
                  {bilgi.metin}
                </p>
              )}
              <form onSubmit={gonder} className="space-y-3">
                <input required minLength={2} placeholder="Adınız" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className={girdiSinifi} />
                <input type="email" placeholder="E-posta (yanıt mail ile de gelsin)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={girdiSinifi} />
                <textarea required minLength={5} maxLength={1000} rows={4} placeholder="Nasıl yardımcı olabiliriz?" value={form.mesaj} onChange={(e) => setForm({ ...form, mesaj: e.target.value })} className={`${girdiSinifi} resize-none`} />
                <button type="submit" disabled={yukleniyor} className="w-full rounded-full bg-[var(--accent)] py-2 text-sm font-medium text-[var(--accent-ink)] hover:bg-[var(--accent)] disabled:opacity-60">
                  {yukleniyor ? "Gönderiliyor..." : "Gönder"}
                </button>
              </form>
            </>
          )}

          {sekme === "mesajlarim" && (
            <div className="space-y-3 overflow-y-auto pr-1">
              {listeYukleniyor && mesajlar.length === 0 && <p className="text-sm text-[var(--muted)]">Yükleniyor...</p>}
              {!listeYukleniyor && mesajlar.length === 0 && <p className="text-sm text-[var(--muted)]">Bu tarayıcıdan gönderilmiş mesaj yok.</p>}
              {mesajlar.map((m) => (
                <div key={m.kod} className="rounded-xl border border-[var(--border)] bg-white/5 p-3 text-sm">
                  <p className="text-[11px] text-[var(--muted)]">{new Date(m.tarih).toLocaleString("tr-TR")}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[var(--text)]">{m.mesaj}</p>
                  {m.yanit ? (
                    <div className="mt-3 rounded-lg border-l-2 border-[var(--accent)] bg-[var(--surface)] px-3 py-2">
                      <p className="text-[11px] font-medium text-[var(--accent)]">Yönetim yanıtı</p>
                      <p className="mt-1 whitespace-pre-wrap text-[var(--text)]">{m.yanit}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--warning)]">Yanıt bekleniyor</p>
                  )}
                </div>
              ))}
              <button type="button" onClick={listeyiYenile} className="w-full rounded-full border border-white/15 py-1.5 text-xs text-[var(--muted)] hover:bg-white/10">
                Yenile
              </button>
            </div>
          )}
        </div>
      )}
      <button type="button" onClick={() => setAcik(!acik)} className="btn-primary relative !px-5 !py-3 text-sm">
        {acik ? "Kapat" : "Canlı Destek"}
        {!acik && okunmamis > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{okunmamis}</span>}
      </button>
    </div>
  );
}
