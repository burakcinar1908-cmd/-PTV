"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/lib/api";
import { m3uAyristir } from "@/lib/m3u";

type Sekme = "ozet" | "kanallar" | "paketler" | "kullanicilar" | "destek";

type Kanal = {
  id: string; ad: string; kategori: string; logo: string; yayinUrl: string; aktif: boolean; paketler: string[];
};
type Sure = { ay: number; fiyat: number };
type Paket = { id: string; ad: string; cihazSiniri: number; sureSecenekleri: Sure[]; ozellikler: string[]; aktif: boolean };

type Bilgi = { tur: "hata" | "basari"; metin: string } | null;

const INPUT = "w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300/60";
const BUTON = "rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300 disabled:opacity-60";
const IKINCIL = "rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10";

function BilgiKutusu({ bilgi }: { bilgi: Bilgi }) {
  if (!bilgi) return null;
  return (
    <p role="alert" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${bilgi.tur === "hata" ? "border-rose-400/40 bg-rose-500/10 text-rose-200" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"}`}>
      {bilgi.metin}
    </p>
  );
}

function Kart({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-medium">{baslik}</h2>
      {children}
    </section>
  );
}

export default function YonetimPanel() {
  const [yetki, setYetki] = useState<"yukleniyor" | "yok" | "var">("yukleniyor");
  const [sekme, setSekme] = useState<Sekme>("ozet");

  useEffect(() => {
    api<{ kullanici: { rol: string } }>("/auth/ben", undefined, "GET").then((s) => {
      setYetki(s.ok && s.veri.kullanici.rol === "yonetici" ? "var" : "yok");
    });
  }, []);

  if (yetki === "yukleniyor") return <p className="px-6 pt-32 text-slate-400">Yükleniyor...</p>;
  if (yetki === "yok") {
    return (
      <div className="mx-auto max-w-md px-6 pt-32">
        <BilgiKutusu bilgi={{ tur: "hata", metin: "Bu sayfaya yalnızca yöneticiler erişebilir." }} />
        <a href="/giris" className="text-cyan-300 hover:text-cyan-200">Giriş yap</a>
      </div>
    );
  }

  const sekmeler: { id: Sekme; ad: string }[] = [
    { id: "ozet", ad: "Özet" },
    { id: "kanallar", ad: "Kanallar" },
    { id: "paketler", ad: "Paketler" },
    { id: "kullanicilar", ad: "Kullanıcılar" },
    { id: "destek", ad: "Destek Mesajları" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
      <h1 className="text-3xl font-semibold">Yönetim Paneli</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {sekmeler.map((s) => (
          <button key={s.id} type="button" onClick={() => setSekme(s.id)} className={`rounded-full px-4 py-2 text-sm transition ${sekme === s.id ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
            {s.ad}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {sekme === "ozet" && <Ozet />}
        {sekme === "kanallar" && <Kanallar />}
        {sekme === "paketler" && <Paketler />}
        {sekme === "kullanicilar" && <Kullanicilar />}
        {sekme === "destek" && <Destek />}
      </div>
    </div>
  );
}

function Ozet() {
  const [veri, setVeri] = useState<{ kullanici: number; kanal: number; aktifAbone: number; yeniDestek: number } | null>(null);
  useEffect(() => {
    api<typeof veri>("/yonetim/ozet", undefined, "GET").then((s) => {
      if (s.ok) setVeri(s.veri);
    });
  }, []);
  if (!veri) return <p className="text-slate-400">Yükleniyor...</p>;
  const kartlar = [
    { ad: "Kullanıcı", deger: veri.kullanici },
    { ad: "Aktif kanal", deger: veri.kanal },
    { ad: "Aktif abonelik", deger: veri.aktifAbone },
    { ad: "Yeni destek mesajı", deger: veri.yeniDestek },
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kartlar.map((k) => (
        <div key={k.ad} className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">{k.ad}</p>
          <p className="mt-2 text-3xl font-semibold">{k.deger}</p>
        </div>
      ))}
    </div>
  );
}

function Kanallar() {
  const [kanallar, setKanallar] = useState<Kanal[]>([]);
  const [paketler, setPaketler] = useState<Paket[]>([]);
  const [bilgi, setBilgi] = useState<Bilgi>(null);
  const [yeni, setYeni] = useState({ ad: "", kategori: "", yayinUrl: "", logo: "" });
  const [yeniPaketler, setYeniPaketler] = useState<string[]>([]);
  const [m3uIcerik, setM3uIcerik] = useState("");
  const [m3uPaketler, setM3uPaketler] = useState<string[]>([]);
  const [islem, setIslem] = useState(false);
  const [secili, setSecili] = useState<string[]>([]);

  async function yukle() {
    const [k, p] = await Promise.all([
      api<{ kanallar: Kanal[] }>("/yonetim/kanallar", undefined, "GET"),
      api<{ paketler: Paket[] }>("/yonetim/paketler", undefined, "GET"),
    ]);
    if (k.ok) setKanallar(k.veri.kanallar);
    if (p.ok) setPaketler(p.veri.paketler);
  }

  useEffect(() => {
    yukle();
  }, []);

  function paketSec(liste: string[], id: string): string[] {
    return liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];
  }

  async function kanalEkle(e: FormEvent) {
    e.preventDefault();
    setIslem(true);
    const sonuc = await api<{ mesaj: string }>("/yonetim/kanallar", { ...yeni, paketler: yeniPaketler });
    setIslem(false);
    setBilgi(sonuc.ok ? { tur: "basari", metin: sonuc.veri.mesaj } : { tur: "hata", metin: sonuc.mesaj });
    if (sonuc.ok) {
      setYeni({ ad: "", kategori: "", yayinUrl: "", logo: "" });
      setYeniPaketler([]);
      yukle();
    }
  }

  async function m3uYukle(e: FormEvent) {
    e.preventDefault();
    setIslem(true);
    setBilgi(null);
    // Sunucu sınırlarına uyacak şekilde kırp; sınırı aşan yayın adresi olan kayıtları atla.
    const kanallar = m3uAyristir(m3uIcerik)
      .map((k) => ({
        ad: k.ad.slice(0, 100),
        kategori: (k.kategori || "Genel").slice(0, 60),
        logo: k.logo.slice(0, 500),
        yayinUrl: k.yayinUrl,
      }))
      .filter((k) => k.yayinUrl.length <= 2000);
    if (kanallar.length === 0) {
      setIslem(false);
      setBilgi({ tur: "hata", metin: "Listede http/https yayın adresi bulunamadı." });
      return;
    }

    const PARCA = 500;
    let eklenen = 0;
    let guncellenen = 0;
    for (let i = 0; i < kanallar.length; i += PARCA) {
      setBilgi({ tur: "basari", metin: `İçe aktarılıyor... ${Math.min(i + PARCA, kanallar.length)} / ${kanallar.length}` });
      const sonuc = await api<{ eklenen: number; guncellenen: number }>("/yonetim/kanal-toplu", {
        kanallar: kanallar.slice(i, i + PARCA),
        paketler: m3uPaketler,
      });
      if (!sonuc.ok) {
        setIslem(false);
        setBilgi({ tur: "hata", metin: `${sonuc.mesaj} (${i} kanaldan sonra durdu, ${eklenen} yeni eklendi)` });
        return;
      }
      eklenen += sonuc.veri.eklenen;
      guncellenen += sonuc.veri.guncellenen;
    }

    setIslem(false);
    setBilgi({ tur: "basari", metin: `${eklenen} yeni kanal eklendi, ${guncellenen} kanal güncellendi.` });
    setM3uIcerik("");
    yukle();
  }

  async function dosyaSec(dosya: File | undefined) {
    if (!dosya) return;
    setM3uIcerik(await dosya.text());
    setBilgi({ tur: "basari", metin: `${dosya.name} okundu. Paketleri seçip içe aktarın.` });
  }

  async function guncelle(id: string, govde: Record<string, unknown>) {
    const sonuc = await api(`/yonetim/kanallar/${id}`, govde, "PATCH");
    if (!sonuc.ok) setBilgi({ tur: "hata", metin: sonuc.mesaj });
    yukle();
  }

  async function sil(id: string, ad: string) {
    if (!window.confirm(`"${ad}" kanalını silmek istediğinize emin misiniz?`)) return;
    await api(`/yonetim/kanallar/${id}`, undefined, "DELETE");
    yukle();
  }

  function duzenle(k: Kanal) {
    const ad = window.prompt("Kanal adı", k.ad);
    if (ad === null) return;
    const yayinUrl = window.prompt("Yayın adresi (http/https)", k.yayinUrl);
    if (yayinUrl === null) return;
    guncelle(k.id, { ad, yayinUrl });
  }

  return (
    <div className="space-y-8">
      <BilgiKutusu bilgi={bilgi} />

      <Kart baslik="Tek kanal ekle">
        <form onSubmit={kanalEkle} className="grid gap-4 md:grid-cols-2">
          <input required placeholder="Kanal adı" value={yeni.ad} onChange={(e) => setYeni({ ...yeni, ad: e.target.value })} className={INPUT} />
          <input required placeholder="Kategori (ör. Haber)" value={yeni.kategori} onChange={(e) => setYeni({ ...yeni, kategori: e.target.value })} className={INPUT} />
          <input required type="url" placeholder="Yayın adresi (.m3u8)" value={yeni.yayinUrl} onChange={(e) => setYeni({ ...yeni, yayinUrl: e.target.value })} className={`${INPUT} md:col-span-2`} />
          <input placeholder="Logo adresi (isteğe bağlı)" value={yeni.logo} onChange={(e) => setYeni({ ...yeni, logo: e.target.value })} className={`${INPUT} md:col-span-2`} />
          <PaketSecici paketler={paketler} secilen={yeniPaketler} onDegis={(id) => setYeniPaketler(paketSec(yeniPaketler, id))} />
          <div className="md:col-span-2">
            <button type="submit" disabled={islem} className={BUTON}>Kanalı ekle</button>
          </div>
        </form>
      </Kart>

      <Kart baslik="M3U / M3U8 listesi içe aktar">
        <form onSubmit={m3uYukle} className="space-y-4">
          <input type="file" accept=".m3u,.m3u8,.txt" onChange={(e) => dosyaSec(e.target.files?.[0])} className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-slate-200" />
          <p className="text-xs text-slate-500">Dosya seçtikten sonra içe aktarılacak paketleri işaretleyin. Aynı yayın adresi varsa kanal güncellenir, yoksa eklenir.</p>
          <PaketSecici paketler={paketler} secilen={m3uPaketler} onDegis={(id) => setM3uPaketler(paketSec(m3uPaketler, id))} />
          <button type="submit" disabled={islem || !m3uIcerik} className={BUTON}>İçe aktar</button>
        </form>
      </Kart>

      <Kart baslik="Toplu işlemler">
        <TopluIslemler
          paketler={paketler}
          secili={secili}
          toplam={kanallar.length}
          onBilgi={setBilgi}
          onBitti={() => {
            setSecili([]);
            yukle();
          }}
        />
      </Kart>

      <Kart baslik={`Kanallar (${kanallar.length})`}>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <button type="button" onClick={() => setSecili(kanallar.map((k) => k.id))} className={IKINCIL}>Listedekilerin tümünü seç</button>
          <button type="button" onClick={() => setSecili([])} className={IKINCIL}>Seçimi temizle</button>
          <span className="text-slate-400">{secili.length} kanal seçili</span>
        </div>
        {kanallar.length === 0 && <p className="text-slate-400">Henüz kanal yok.</p>}
        <div className="space-y-3">
          {kanallar.map((k) => (
            <div key={k.id} className={`relative rounded-xl border border-white/10 bg-slate-950/40 p-4 pl-12 ${k.aktif ? "" : "opacity-60"}`}>
              <input
                type="checkbox"
                aria-label={`${k.ad} seç`}
                checked={secili.includes(k.id)}
                onChange={() => setSecili(secili.includes(k.id) ? secili.filter((x) => x !== k.id) : [...secili, k.id])}
                className="absolute left-4 top-5 h-4 w-4 accent-cyan-400"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{k.ad} <span className="ml-2 text-xs text-cyan-300">{k.kategori}</span></p>
                  <p className="truncate text-xs text-slate-500">{k.yayinUrl}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => guncelle(k.id, { aktif: !k.aktif })} className={IKINCIL}>{k.aktif ? "Pasifleştir" : "Aktifleştir"}</button>
                  <button type="button" onClick={() => duzenle(k)} className={IKINCIL}>Düzenle</button>
                  <button type="button" onClick={() => sil(k.id, k.ad)} className="rounded-full border border-rose-400/40 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10">Sil</button>
                </div>
              </div>
              <div className="mt-3">
                <PaketSecici paketler={paketler} secilen={k.paketler} onDegis={(id) => guncelle(k.id, { paketler: paketSec(k.paketler, id) })} />
              </div>
            </div>
          ))}
        </div>
      </Kart>
    </div>
  );
}

function PaketSecici({ paketler, secilen, onDegis }: { paketler: Paket[]; secilen: string[]; onDegis: (id: string) => void }) {
  if (paketler.length === 0) return <p className="text-xs text-slate-500">Önce paket ekleyin.</p>;
  return (
    <div className="flex flex-wrap gap-2 md:col-span-2">
      <span className="self-center text-xs text-slate-400">Hangi paketlerde görünsün:</span>
      {paketler.map((p) => {
        const acik = secilen.includes(p.id);
        return (
          <button key={p.id} type="button" onClick={() => onDegis(p.id)} className={`rounded-full px-3 py-1.5 text-xs transition ${acik ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
            {p.ad}
          </button>
        );
      })}
    </div>
  );
}

function Paketler() {
  const [paketler, setPaketler] = useState<Paket[]>([]);
  const [bilgi, setBilgi] = useState<Bilgi>(null);

  async function yukle() {
    const s = await api<{ paketler: Paket[] }>("/yonetim/paketler", undefined, "GET");
    if (s.ok) setPaketler(s.veri.paketler);
  }
  useEffect(() => {
    yukle();
  }, []);

  function guncelle(id: string, degisiklik: Partial<Paket>) {
    setPaketler((liste) => liste.map((p) => (p.id === id ? { ...p, ...degisiklik } : p)));
  }

  async function kaydet(p: Paket) {
    setBilgi(null);
    if (new Set(p.sureSecenekleri.map((s) => s.ay)).size !== p.sureSecenekleri.length) {
      setBilgi({ tur: "hata", metin: "Aynı süre iki kez eklenemez." });
      return;
    }
    const sonuc = await api<{ mesaj: string }>(`/yonetim/paketler/${p.id}`, {
      ad: p.ad,
      cihazSiniri: p.cihazSiniri,
      sureSecenekleri: p.sureSecenekleri,
      ozellikler: p.ozellikler,
      aktif: p.aktif,
    }, "PATCH");
    setBilgi(sonuc.ok ? { tur: "basari", metin: `${p.ad} paketi kaydedildi.` } : { tur: "hata", metin: sonuc.mesaj });
  }

  return (
    <div className="space-y-6">
      <BilgiKutusu bilgi={bilgi} />
      <p className="text-sm text-slate-400">Her paket için cihaz sınırını, süre seçeneklerini ve fiyatları buradan değiştirebilirsiniz. Değişiklik Kaydet'e basınca sitedeki paketlere yansır.</p>
      {paketler.map((p) => (
        <Kart key={p.id} baslik={p.ad}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Paket adı</span>
              <input value={p.ad} onChange={(e) => guncelle(p.id, { ad: e.target.value })} className={INPUT} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Aynı anda cihaz sınırı</span>
              <input type="number" min={1} max={20} value={p.cihazSiniri} onChange={(e) => guncelle(p.id, { cihazSiniri: Number(e.target.value) })} className={INPUT} />
            </label>
            <div className="md:col-span-2">
              <span className="mb-2 block text-xs text-slate-400">Süre ve fiyat (₺, 0 = ücretsiz)</span>
              <div className="space-y-2">
                {p.sureSecenekleri.map((s, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      type="number" min={1} max={36} aria-label="Süre (ay)" value={s.ay}
                      onChange={(e) => guncelle(p.id, { sureSecenekleri: p.sureSecenekleri.map((x, j) => (j === i ? { ...x, ay: Number(e.target.value) } : x)) })}
                      className={`${INPUT} w-24`}
                    />
                    <span className="text-xs text-slate-400">ay</span>
                    <input
                      type="number" min={0} max={100000} step="0.01" aria-label="Fiyat (₺)" value={s.fiyat}
                      onChange={(e) => guncelle(p.id, { sureSecenekleri: p.sureSecenekleri.map((x, j) => (j === i ? { ...x, fiyat: Number(e.target.value) } : x)) })}
                      className={`${INPUT} w-32`}
                    />
                    <span className="text-xs text-slate-400">₺</span>
                    <button
                      type="button" disabled={p.sureSecenekleri.length <= 1}
                      onClick={() => guncelle(p.id, { sureSecenekleri: p.sureSecenekleri.filter((_, j) => j !== i) })}
                      className="rounded-full border border-rose-400/40 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      Sil
                    </button>
                  </div>
                ))}
                {p.sureSecenekleri.length < 6 && (
                  <button
                    type="button"
                    onClick={() => guncelle(p.id, { sureSecenekleri: [...p.sureSecenekleri, { ay: 1, fiyat: 0 }] })}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                  >
                    + Süre ekle
                  </button>
                )}
              </div>
            </div>
            <label className="flex items-center gap-3 pt-6 text-sm text-slate-300">
              <input type="checkbox" checked={p.aktif} onChange={(e) => guncelle(p.id, { aktif: e.target.checked })} />
              Pakette satışa açık
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs text-slate-400">Özellikler (her satıra bir tane)</span>
              <textarea rows={3} value={p.ozellikler.join("\n")} onChange={(e) => guncelle(p.id, { ozellikler: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} className={INPUT} />
            </label>
          </div>
          <div className="mt-4">
            <button type="button" onClick={() => kaydet(p)} className={BUTON}>Kaydet</button>
          </div>
        </Kart>
      ))}
    </div>
  );
}

type KullaniciSatiri = {
  id: string; ad: string; email: string; rol: string; emailDogrulandi: boolean; dondurulduMu: boolean; paket: string | null;
};
type DestekSatiri = {
  id: string; ad: string; email: string; mesaj: string; durum: string; tarih: string; yanit: string; yanitTarih: string | null;
};

const KUCUK_BUTON = "rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-50";
const TEHLIKE_BUTON = "rounded-full border border-rose-400/40 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10";

function Kullanicilar() {
  const [liste, setListe] = useState<KullaniciSatiri[]>([]);
  const [paketler, setPaketler] = useState<Paket[]>([]);
  const [islemde, setIslemde] = useState<string | null>(null);

  async function yukle() {
    const s = await api<{ kullanicilar: KullaniciSatiri[] }>("/yonetim/kullanicilar", undefined, "GET");
    if (s.ok) setListe(s.veri.kullanicilar);
  }

  useEffect(() => {
    yukle();
    api<{ paketler: Paket[] }>("/yonetim/paketler", undefined, "GET").then((s) => {
      if (s.ok) setPaketler(s.veri.paketler);
    });
  }, []);

  async function calistir(k: KullaniciSatiri, sonuc: Promise<{ ok: boolean; mesaj?: string }>) {
    setIslemde(k.id);
    const s = await sonuc;
    setIslemde(null);
    if (!s.ok) window.alert(s.mesaj ?? "İşlem başarısız.");
    yukle();
  }

  function dondur(k: KullaniciSatiri) {
    const yeni = !k.dondurulduMu;
    if (!window.confirm(`${k.email} hesabı ${yeni ? "dondurulsun" : "yeniden açılsın"} mu?`)) return;
    calistir(k, api(`/yonetim/kullanicilar/${k.id}`, { dondurulduMu: yeni }, "PATCH"));
  }

  function sifreDegistir(k: KullaniciSatiri) {
    const sifre = window.prompt(`${k.email} için yeni şifre (en az 8 karakter):`);
    if (!sifre) return;
    calistir(k, api(`/yonetim/kullanicilar/${k.id}`, { sifre }, "PATCH"));
  }

  function emailDegistir(k: KullaniciSatiri) {
    const email = window.prompt("Yeni e-posta:", k.email);
    if (!email || email === k.email) return;
    calistir(k, api(`/yonetim/kullanicilar/${k.id}`, { email }, "PATCH"));
  }

  function abonelikEkle(k: KullaniciSatiri) {
    if (paketler.length === 0) return window.alert("Önce paket ekleyin.");
    const secim = window.prompt(`Paket seçin:\n${paketler.map((p, i) => `${i + 1}) ${p.ad}`).join("\n")}`, "1");
    const paket = paketler[Number(secim) - 1];
    if (!paket) return;
    const ay = Number(window.prompt("Kaç ay?", "1"));
    if (!Number.isInteger(ay) || ay < 1) return;
    calistir(k, api(`/yonetim/kullanicilar/${k.id}/abonelik`, { planId: paket.id, ay }, "POST"));
  }

  function gecmisTemizle(k: KullaniciSatiri) {
    if (!window.confirm(`${k.email} izleme geçmişi silinsin mi?`)) return;
    calistir(k, api(`/yonetim/kullanicilar/${k.id}/gecmis-temizle`, undefined, "POST"));
  }

  function sil(k: KullaniciSatiri) {
    if (!window.confirm(`${k.email} hesabı kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) return;
    calistir(k, api(`/yonetim/kullanicilar/${k.id}`, undefined, "DELETE"));
  }

  return (
    <Kart baslik={`Kullanıcılar (${liste.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="pb-3">Ad</th>
              <th className="pb-3">E-posta</th>
              <th className="pb-3">Rol</th>
              <th className="pb-3">Paket</th>
              <th className="pb-3">Durum</th>
              <th className="pb-3">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {liste.map((k) => (
              <tr key={k.id} className={k.dondurulduMu ? "opacity-60" : ""}>
                <td className="py-3">{k.ad}</td>
                <td className="py-3">{k.email}</td>
                <td className="py-3">{k.rol === "yonetici" ? "Yönetici" : "Kullanıcı"}</td>
                <td className="py-3">{k.paket ?? "-"}</td>
                <td className="py-3">
                  {k.dondurulduMu ? "Dondurulmuş" : k.emailDogrulandi ? "Doğrulandı" : "Doğrulanmadı"}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={islemde === k.id} onClick={() => dondur(k)} className={KUCUK_BUTON}>
                      {k.dondurulduMu ? "Aç" : "Dondur"}
                    </button>
                    <button type="button" disabled={islemde === k.id} onClick={() => sifreDegistir(k)} className={KUCUK_BUTON}>Şifre</button>
                    <button type="button" disabled={islemde === k.id} onClick={() => emailDegistir(k)} className={KUCUK_BUTON}>E-posta</button>
                    <button type="button" disabled={islemde === k.id} onClick={() => abonelikEkle(k)} className={KUCUK_BUTON}>Üyelik ekle</button>
                    <button type="button" disabled={islemde === k.id} onClick={() => gecmisTemizle(k)} className={KUCUK_BUTON}>Geçmişi sil</button>
                    <button type="button" disabled={islemde === k.id} onClick={() => sil(k)} className={TEHLIKE_BUTON}>Hesabı kapat</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Kart>
  );
}

function Destek() {
  const [liste, setListe] = useState<DestekSatiri[]>([]);
  const [taslak, setTaslak] = useState<Record<string, string>>({});
  const [gonderiliyor, setGonderiliyor] = useState<string | null>(null);

  async function yukle() {
    const s = await api<{ mesajlar: DestekSatiri[] }>("/yonetim/destek", undefined, "GET");
    if (s.ok) setListe(s.veri.mesajlar);
  }
  useEffect(() => {
    yukle();
  }, []);

  async function durumDegistir(id: string, durum: string) {
    await api(`/yonetim/destek/${id}`, { durum: durum === "yeni" ? "okundu" : "yeni" }, "PATCH");
    yukle();
  }

  async function yanitla(m: DestekSatiri) {
    const yanit = (taslak[m.id] ?? "").trim();
    if (yanit.length < 2) return;
    setGonderiliyor(m.id);
    const s = await api<{ mesaj: string }>(`/yonetim/destek/${m.id}/yanit`, { yanit }, "POST");
    setGonderiliyor(null);
    if (!s.ok) {
      window.alert(s.mesaj);
      return;
    }
    setTaslak((t) => ({ ...t, [m.id]: "" }));
    yukle();
    window.alert(s.veri.mesaj);
  }

  return (
    <Kart baslik={`Destek mesajları (${liste.length})`}>
      {liste.length === 0 && <p className="text-slate-400">Henüz mesaj yok.</p>}
      <div className="space-y-3">
        {liste.map((m) => (
          <div key={m.id} className={`rounded-xl border p-4 ${m.durum === "yeni" ? "border-cyan-300/40 bg-cyan-400/5" : "border-white/10 bg-slate-950/40"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>{m.ad}{m.email ? ` · ${m.email}` : ""}</span>
              <span>{new Date(m.tarih).toLocaleString("tr-TR")}</span>
            </div>
            <p className="mt-2 text-slate-200">{m.mesaj}</p>

            {m.yanit && (
              <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/5 p-3 text-sm text-slate-200">
                <p className="mb-1 text-xs text-emerald-300">
                  Yanıt{m.yanitTarih ? ` · ${new Date(m.yanitTarih).toLocaleString("tr-TR")}` : ""}
                </p>
                {m.yanit}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2 md:flex-row">
              <textarea
                rows={2}
                maxLength={2000}
                placeholder="Yanıtınızı yazın..."
                value={taslak[m.id] ?? ""}
                onChange={(e) => setTaslak({ ...taslak, [m.id]: e.target.value })}
                className={INPUT}
              />
              <button
                type="button"
                disabled={gonderiliyor === m.id || (taslak[m.id] ?? "").trim().length < 2}
                onClick={() => yanitla(m)}
                className={BUTON}
              >
                {gonderiliyor === m.id ? "Gönderiliyor..." : "Yanıtla"}
              </button>
            </div>

            <button type="button" onClick={() => durumDegistir(m.id, m.durum)} className="mt-3 text-xs text-cyan-300 hover:text-cyan-200">
              {m.durum === "yeni" ? "Okundu olarak işaretle" : "Yeni olarak işaretle"}
            </button>
          </div>
        ))}
      </div>
    </Kart>
  );
}

function TopluIslemler({
  paketler,
  secili,
  toplam,
  onBilgi,
  onBitti,
}: {
  paketler: Paket[];
  secili: string[];
  toplam: number;
  onBilgi: (b: Bilgi) => void;
  onBitti: () => void;
}) {
  const [tumu, setTumu] = useState(false);
  const [paketSecim, setPaketSecim] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  const hedefAciklama = tumu ? `tüm ${toplam} kanal` : `${secili.length} seçili kanal`;

  async function uygula(islemAdi: "paketEkle" | "paketCikar" | "aktif" | "pasif" | "sil") {
    if (!tumu && secili.length === 0) {
      onBilgi({ tur: "hata", metin: "Önce kanal seçin ya da 'Tüm kanallar' hedefini seçin." });
      return;
    }
    if ((islemAdi === "paketEkle" || islemAdi === "paketCikar") && paketSecim.length === 0) {
      onBilgi({ tur: "hata", metin: "Önce bir paket seçin." });
      return;
    }
    if (islemAdi === "sil" && !window.confirm(`${hedefAciklama} silinecek. Bu işlem geri alınamaz. Emin misiniz?`)) return;
    if (tumu && islemAdi !== "sil" && !window.confirm(`${hedefAciklama} için bu işlem uygulanacak. Emin misiniz?`)) return;

    setYukleniyor(true);
    const sonuc = await api<{ mesaj: string }>("/yonetim/kanallar/toplu", {
      islem: islemAdi,
      kanalIdleri: secili,
      tumu,
      paketler: paketSecim,
    });
    setYukleniyor(false);
    onBilgi(sonuc.ok ? { tur: "basari", metin: sonuc.veri.mesaj } : { tur: "hata", metin: sonuc.mesaj });
    if (sonuc.ok) onBitti();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTumu(false)} className={`rounded-full px-4 py-2 text-sm transition ${!tumu ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
          Seçili kanallar ({secili.length})
        </button>
        <button type="button" onClick={() => setTumu(true)} className={`rounded-full px-4 py-2 text-sm transition ${tumu ? "bg-amber-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
          Tüm kanallar ({toplam})
        </button>
      </div>

      <div>
        <span className="mb-2 block text-xs text-slate-400">Paketler</span>
        <div className="flex flex-wrap gap-2">
          {paketler.map((p) => {
            const acik = paketSecim.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaketSecim(acik ? paketSecim.filter((x) => x !== p.id) : [...paketSecim, p.id])}
                className={`rounded-full px-3 py-1.5 text-xs transition ${acik ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
              >
                {p.ad}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={yukleniyor} onClick={() => uygula("paketEkle")} className={BUTON}>Paketlere ekle</button>
        <button type="button" disabled={yukleniyor} onClick={() => uygula("paketCikar")} className={IKINCIL}>Paketlerden çıkar</button>
        <button type="button" disabled={yukleniyor} onClick={() => uygula("aktif")} className={IKINCIL}>Aktifleştir</button>
        <button type="button" disabled={yukleniyor} onClick={() => uygula("pasif")} className={IKINCIL}>Pasifleştir</button>
        <button type="button" disabled={yukleniyor} onClick={() => uygula("sil")} className="rounded-full border border-rose-400/40 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10">Sil</button>
      </div>
    </div>
  );
}
