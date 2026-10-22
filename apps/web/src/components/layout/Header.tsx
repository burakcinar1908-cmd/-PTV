"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Header() {
  const [durum, setDurum] = useState<"yukleniyor" | "cikis" | "giris" | "yonetici">("yukleniyor");

  useEffect(() => {
    api<{ kullanici: { rol: string } }>("/auth/ben", undefined, "GET").then((s) => {
      if (!s.ok) setDurum("cikis");
      else setDurum(s.veri.kullanici.rol === "yonetici" ? "yonetici" : "giris");
    });
  }, []);

  async function cikis() {
    await api("/auth/cikis");
    window.location.href = "/";
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[var(--bg)]/70 ">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="font-semibold tracking-wide text-[var(--text)]">IPTV Platform</a>
        <nav className="flex items-center gap-5 text-sm">
          <a href="/kanallar" className="text-[var(--muted)] hover:text-white">Kanallar</a>
          <a href="/#paketler" className="text-[var(--muted)] hover:text-white">Paketler</a>
          {(durum === "giris" || durum === "yonetici") && (
            <>
              {durum === "yonetici" && <a href="/yonetim" className="text-[var(--accent)] hover:text-[var(--accent)]">Yönetim</a>}
              <a href="/hesap" className="text-[var(--muted)] hover:text-white">Hesabım</a>
              <button type="button" onClick={cikis} className="btn-secondary !px-4 !py-2 text-sm">
                Çıkış
              </button>
            </>
          )}
          {durum === "cikis" && (
            <>
              <a href="/giris" className="text-[var(--muted)] hover:text-white">Giriş</a>
              <a href="/kayit" className="btn-primary !px-4 !py-2 text-sm">Kayıt Ol</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
