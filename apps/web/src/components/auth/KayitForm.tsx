"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Alan, Bildirim, Dugme } from "./ui";

export default function KayitForm() {
  const [form, setForm] = useState({ ad: "", email: "", sifre: "" });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);
    const sonuc = await api<{ mesaj: string }>("/auth/kayit", form);
    setYukleniyor(false);
    if (sonuc.ok) setBasari(sonuc.veri.mesaj);
    else setHata(sonuc.mesaj);
  }

  if (basari) {
    return <Bildirim tur="basari">{basari} Doğrulama bağlantısı için geliştirme ortamında API terminaline bakın.</Bildirim>;
  }

  return (
    <form onSubmit={gonder} className="space-y-5">
      {hata && <Bildirim tur="hata">{hata}</Bildirim>}
      <Alan etiket="Ad Soyad" autoComplete="name" required minLength={2} value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} />
      <Alan etiket="E-posta" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Alan etiket="Şifre" type="password" autoComplete="new-password" required minLength={8} value={form.sifre} onChange={(e) => setForm({ ...form, sifre: e.target.value })} />
      <p className="text-xs text-[var(--muted)]">En az 8 karakter; en az bir harf ve bir rakam içermelidir.</p>
      <Dugme type="submit" disabled={yukleniyor}>{yukleniyor ? "Kaydediliyor..." : "Hesap Oluştur"}</Dugme>
    </form>
  );
}
