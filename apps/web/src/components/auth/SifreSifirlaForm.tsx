"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Alan, AltBaglanti, Bildirim, Dugme } from "./ui";

export default function SifreSifirlaForm({ token }: { token: string }) {
  const [yeniSifre, setYeniSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState<{ tur: "hata" | "basari"; metin: string } | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    const sonuc = await api<{ mesaj: string }>("/auth/sifre-sifirla", { token, yeniSifre });
    setYukleniyor(false);
    setMesaj(sonuc.ok ? { tur: "basari", metin: sonuc.veri.mesaj } : { tur: "hata", metin: sonuc.mesaj });
  }

  if (!token) return <Bildirim tur="hata">Sıfırlama bağlantısında token bulunamadı.</Bildirim>;

  return (
    <form onSubmit={gonder} className="space-y-5">
      {mesaj && <Bildirim tur={mesaj.tur}>{mesaj.metin}</Bildirim>}
      <Alan etiket="Yeni şifre" type="password" autoComplete="new-password" required minLength={8} value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)} />
      <p className="text-xs text-[var(--muted)]">En az 8 karakter; en az bir harf ve bir rakam içermelidir.</p>
      <Dugme type="submit" disabled={yukleniyor}>{yukleniyor ? "Güncelleniyor..." : "Şifreyi Güncelle"}</Dugme>
      <AltBaglanti>
        <a href="/giris" className="text-[var(--accent)] hover:text-[var(--accent)]">Giriş sayfasına dön</a>
      </AltBaglanti>
    </form>
  );
}
