"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export default function KilitAc({ kategoriler, tumu = false, onAcildi }: { kategoriler: string[]; tumu?: boolean; onAcildi: () => void }) {
  const [pin, setPin] = useState("");
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [islem, setIslem] = useState(false);

  async function gonder(e: FormEvent) {
    e.preventDefault();
    setIslem(true);
    setMesaj(null);
    const sonuc = await api<{ mesaj: string }>("/hesap/ebeveyn/kilit-ac", { pin });
    setIslem(false);
    if (sonuc.ok) {
      setPin("");
      onAcildi();
    } else {
      setMesaj(sonuc.mesaj);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-amber-400/30 bg-amber-500/5 p-5">
      {tumu ? (
        <p className="text-slate-100">Ebeveyn kilidi aktif: <span className="text-amber-200">tüm kanallar</span> gizli. Görmek için PIN girin.</p>
      ) : (
        <p className="text-slate-100">Ebeveyn kilidi aktif: <span className="text-amber-200">{kategoriler.join(", ")}</span> kategorileri gizli.</p>
      )}
      <form onSubmit={gonder} className="mt-3 flex flex-wrap items-center gap-3">
        <input
          required
          inputMode="numeric"
          pattern="\d{4,6}"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-32 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300/60"
        />
        <button type="submit" disabled={islem} className="rounded-full bg-amber-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-300 disabled:opacity-60">
          Kilidi aç (30 dk)
        </button>
        {mesaj && <span className="text-sm text-rose-200">{mesaj}</span>}
      </form>
    </div>
  );
}
