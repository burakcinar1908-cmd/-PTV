"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

type Durum = "yukleniyor" | "cikis" | "giris" | "yonetici";

const BAG =
  "nav-bag inline-flex min-h-[44px] items-center rounded-lg px-3 text-[0.9375rem] text-[var(--muted)] transition-colors duration-150 hover:text-[var(--text)]";

export default function Header() {
  const [durum, setDurum] = useState<Durum>("yukleniyor");
  const [acik, setAcik] = useState(false);
  const yol = usePathname();

  useEffect(() => {
    api<{ kullanici: { rol: string } }>("/auth/ben", undefined, "GET").then((s) => {
      if (!s.ok) setDurum("cikis");
      else setDurum(s.veri.kullanici.rol === "yonetici" ? "yonetici" : "giris");
    });
  }, []);

  useEffect(() => {
    setAcik(false);
  }, [yol]);

  useEffect(() => {
    if (!acik) return;
    const kapat = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    window.addEventListener("keydown", kapat);
    return () => window.removeEventListener("keydown", kapat);
  }, [acik]);

  async function cikis() {
    await api("/auth/cikis");
    window.location.href = "/";
  }

  const simdiki = (hedef: string) => (yol === hedef ? ("page" as const) : undefined);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <a href="/" className="inline-flex min-h-[56px] items-center gap-2.5 font-display text-2xl font-semibold text-[var(--text)]">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-[var(--accent)]" />
          IPTV Platform
        </a>

        <button
          type="button"
          className="btn-secondary !px-4 text-[0.9375rem] md:hidden"
          aria-expanded={acik}
          aria-controls="ana-menu"
          onClick={() => setAcik(!acik)}
        >
          {acik ? "Menüyü kapat" : "Menü"}
        </button>

        <nav
          id="ana-menu"
          aria-label="Ana menü"
          className={`${acik ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-[var(--border)] bg-[var(--bg)] px-6 pb-4 md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0`}
        >
          <a href="/kanallar" className={BAG} aria-current={simdiki("/kanallar")}>
            Kanallar
          </a>
          <a href="/#paketler" className={BAG}>
            Paketler
          </a>
          {(durum === "giris" || durum === "yonetici") && (
            <>
              {durum === "yonetici" && (
                <a href="/yonetim" className={`${BAG} !text-[var(--accent)]`} aria-current={simdiki("/yonetim")}>
                  Yönetim
                </a>
              )}
              <a href="/hesap" className={BAG} aria-current={simdiki("/hesap")}>
                Hesabım
              </a>
              <button type="button" onClick={cikis} className="btn-secondary !px-4 text-[0.9375rem] md:ml-2">
                Çıkış yap
              </button>
            </>
          )}
          {durum === "cikis" && (
            <>
              <a href="/giris" className={BAG} aria-current={simdiki("/giris")}>
                Giriş yap
              </a>
              <a href="/kayit" className="btn-primary !px-4 text-[0.9375rem] md:ml-2">
                Hesap oluştur
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
