"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Alan, Bildirim, Dugme } from "./ui";

export default function GirisForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", sifre: "" });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);
    const sonuc = await api("/auth/giris", form);
    setYukleniyor(false);
    if (sonuc.ok) router.push("/hesap");
    else setHata(sonuc.mesaj);
  }

  return (
    <form onSubmit={gonder} className="space-y-5">
      {hata && <Bildirim tur="hata">{hata}</Bildirim>}
      <Alan etiket="E-posta" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Alan etiket="Şifre" type="password" autoComplete="current-password" required value={form.sifre} onChange={(e) => setForm({ ...form, sifre: e.target.value })} />
      <div className="flex justify-end">
        <a href="/sifre-sifirla-iste" className="text-sm text-[var(--accent)] hover:text-[var(--accent)]">Şifremi unuttum</a>
      </div>
      <Dugme type="submit" disabled={yukleniyor}>{yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}</Dugme>
    </form>
  );
}
