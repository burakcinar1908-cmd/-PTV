"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AltBaglanti, Bildirim, Dugme } from "./ui";
import EbeveynKontrolu from "@/components/hesap/EbeveynKontrolu";

type Kullanici = { id: string; ad: string; email: string; rol: string; emailDogrulandi: boolean };
type Abonelik = { paket: string; cihazSiniri: number; bitis: string; saglayici: string } | null;

export default function HesapView() {
  const router = useRouter();
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [abonelik, setAbonelik] = useState<Abonelik | undefined>(undefined);
  const [hata, setHata] = useState<string | null>(null);
  const [cikisYapiliyor, setCikisYapiliyor] = useState(false);

  useEffect(() => {
    api<{ kullanici: Kullanici }>("/auth/ben", undefined, "GET").then((sonuc) => {
      if (sonuc.ok) setKullanici(sonuc.veri.kullanici);
      else setHata(sonuc.mesaj);
    });
    api<{ abonelik: Abonelik }>("/paketler/abonelik", undefined, "GET").then((sonuc) => {
      setAbonelik(sonuc.ok ? sonuc.veri.abonelik : null);
    });
  }, []);

  async function cikis() {
    setCikisYapiliyor(true);
    await api("/auth/cikis");
    router.push("/");
    router.refresh();
  }

  if (hata) {
    return (
      <>
        <Bildirim tur="hata">{hata}</Bildirim>
        <AltBaglanti>
          <a href="/giris" className="text-cyan-300 hover:text-cyan-200">Giriş yap</a>
        </AltBaglanti>
      </>
    );
  }

  if (!kullanici) return <p className="text-slate-400">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <dl className="space-y-4 text-sm">
        <div><dt className="text-slate-400">Ad Soyad</dt><dd className="mt-1 text-base">{kullanici.ad}</dd></div>
        <div><dt className="text-slate-400">E-posta</dt><dd className="mt-1 text-base">{kullanici.email}</dd></div>
        <div><dt className="text-slate-400">Hesap türü</dt><dd className="mt-1 text-base">{kullanici.rol === "yonetici" ? "Yönetici" : "Kullanıcı"}</dd></div>
        <div>
          <dt className="text-slate-400">Paket</dt>
          <dd className="mt-1 text-base">
            {abonelik === undefined && "Yükleniyor..."}
            {abonelik === null && (
              <>Aktif paketiniz yok. <a href="/#paketler" className="text-cyan-300 hover:text-cyan-200">Paketlere bakın</a></>
            )}
            {abonelik && (
              <>
                {abonelik.paket} · {abonelik.cihazSiniri} cihaz · bitiş {new Date(abonelik.bitis).toLocaleDateString("tr-TR")}
              </>
            )}
          </dd>
        </div>
      </dl>
      <EbeveynKontrolu />
      <Dugme type="button" onClick={cikis} disabled={cikisYapiliyor}>
        {cikisYapiliyor ? "Çıkış yapılıyor..." : "Çıkış Yap"}
      </Dugme>
    </div>
  );
}
