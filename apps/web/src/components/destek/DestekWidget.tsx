"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export default function DestekWidget() {
  const [acik, setAcik] = useState(false);
  const [form, setForm] = useState({ ad: "", email: "", mesaj: "" });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [bilgi, setBilgi] = useState<{ tur: "hata" | "basari"; metin: string } | null>(null);

  async function gonder(e: FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setBilgi(null);
    const sonuc = await api<{ mesaj: string }>("/destek", form);
    setYukleniyor(false);
    if (sonuc.ok) {
      setBilgi({ tur: "basari", metin: sonuc.veri.mesaj });
      setForm({ ad: "", email: "", mesaj: "" });
    } else {
      setBilgi({ tur: "hata", metin: sonuc.mesaj });
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {acik && (
        <div className="w-80 rounded-2xl border border-white/10 bg-slate-950/95 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Destek</p>
              <p className="text-xs text-slate-400">Mesajınız yönetim ekibine iletilir.</p>
            </div>
            <button type="button" onClick={() => setAcik(false)} aria-label="Kapat" className="text-slate-400 hover:text-white">✕</button>
          </div>
          {bilgi && (
            <p className={`mb-3 rounded-lg px-3 py-2 text-xs ${bilgi.tur === "hata" ? "bg-rose-500/10 text-rose-200" : "bg-emerald-500/10 text-emerald-200"}`}>
              {bilgi.metin}
            </p>
          )}
          <form onSubmit={gonder} className="space-y-3">
            <input required minLength={2} placeholder="Adınız" value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300/60" />
            <input type="email" placeholder="E-posta (isteğe bağlı)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300/60" />
            <textarea required minLength={5} maxLength={1000} rows={4} placeholder="Nasıl yardımcı olabiliriz?" value={form.mesaj} onChange={(e) => setForm({ ...form, mesaj: e.target.value })} className="w-full resize-none rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300/60" />
            <button type="submit" disabled={yukleniyor} className="w-full rounded-full bg-cyan-400 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
              {yukleniyor ? "Gönderiliyor..." : "Gönder"}
            </button>
          </form>
        </div>
      )}
      <button type="button" onClick={() => setAcik(!acik)} className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-medium text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:scale-105 hover:bg-cyan-300">
        {acik ? "Kapat" : "Canlı Destek"}
      </button>
    </div>
  );
}
