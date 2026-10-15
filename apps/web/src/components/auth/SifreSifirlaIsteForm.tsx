"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Alan, Bildirim, Dugme } from "./ui";

export default function SifreSifirlaIsteForm() {
  const [email, setEmail] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState<{ tur: "hata" | "basari"; metin: string } | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    const sonuc = await api<{ mesaj: string }>("/auth/sifre-sifirla-iste", { email });
    setYukleniyor(false);
    setMesaj(sonuc.ok ? { tur: "basari", metin: sonuc.veri.mesaj } : { tur: "hata", metin: sonuc.mesaj });
  }

  return (
    <form onSubmit={gonder} className="space-y-5">
      {mesaj && <Bildirim tur={mesaj.tur}>{mesaj.metin}</Bildirim>}
      <Alan etiket="E-posta" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Dugme type="submit" disabled={yukleniyor}>{yukleniyor ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}</Dugme>
    </form>
  );
}
