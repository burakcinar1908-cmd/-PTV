"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { AltBaglanti, Bildirim } from "./ui";

export default function DogrulaForm({ token }: { token: string }) {
  const [durum, setDurum] = useState<{ tur: "hata" | "basari"; mesaj: string } | null>(null);
  const istendi = useRef(false);

  useEffect(() => {
    // Token tek kullanımlık; Strict Mode'da iki kez gönderilmesini engeller.
    if (istendi.current) return;
    istendi.current = true;
    if (!token) {
      setDurum({ tur: "hata", mesaj: "Doğrulama bağlantısında token bulunamadı." });
      return;
    }
    api<{ mesaj: string }>("/auth/dogrula", { token }).then((sonuc) => {
      setDurum(sonuc.ok ? { tur: "basari", mesaj: sonuc.veri.mesaj } : { tur: "hata", mesaj: sonuc.mesaj });
    });
  }, [token]);

  if (!durum) return <p className="text-[var(--muted)]">Doğrulanıyor...</p>;

  return (
    <>
      <Bildirim tur={durum.tur}>{durum.mesaj}</Bildirim>
      <AltBaglanti>
        <a href="/giris" className="text-[var(--accent)] hover:text-[var(--accent)]">Giriş sayfasına git</a>
      </AltBaglanti>
    </>
  );
}
