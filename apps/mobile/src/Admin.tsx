import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { istek } from "./api";
import { bosluk, renk } from "./theme";

// Sadece rolü "yonetici" olan hesaplara gösterilir. Sunucu zaten ayrıca yetki kontrolü yapıyor.

type KullaniciSatiri = { id: string; ad: string; email: string; rol: string; dondurulduMu: boolean; paket: string | null };
type DestekSatiri = { id: string; ad: string; email: string; mesaj: string; durum: string; tarih: string; yanit: string };

export default function Admin() {
  const [bolum, setBolum] = useState<"kullanici" | "destek" | "kategori">("kullanici");

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.altSekmeSatiri}>
        {(["kullanici", "destek", "kategori"] as const).map((b) => (
          <Pressable key={b} onPress={() => setBolum(b)} style={[styles.altSekme, bolum === b && styles.altSekmeAktif]}>
            <Text style={[styles.altSekmeYazi, bolum === b && styles.altSekmeYaziAktif]}>
              {b === "kullanici" ? "Kullanıcılar" : b === "destek" ? "Destek" : "Kategoriler"}
            </Text>
          </Pressable>
        ))}
      </View>
      {bolum === "kullanici" ? <KullaniciListesi /> : bolum === "destek" ? <DestekListesi /> : <KategoriListesi />}
    </View>
  );
}

function KullaniciListesi() {
  const [liste, setListe] = useState<KullaniciSatiri[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, setIslemde] = useState<string | null>(null);

  async function yukle() {
    const s = await istek<{ kullanicilar: KullaniciSatiri[] }>("/yonetim/kullanicilar");
    if (!s.ok) return setHata(s.mesaj);
    setListe(s.veri.kullanicilar);
  }

  useEffect(() => {
    yukle();
  }, []);

  function dondurDegistir(k: KullaniciSatiri) {
    const yeni = !k.dondurulduMu;
    Alert.alert(yeni ? "Hesabı dondur" : "Hesabı aç", k.email, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Onayla",
        style: yeni ? "destructive" : "default",
        onPress: async () => {
          setIslemde(k.id);
          const s = await istek<{ mesaj: string }>(`/yonetim/kullanicilar/${k.id}`, { dondurulduMu: yeni }, "PATCH");
          setIslemde(null);
          if (!s.ok) return Alert.alert("Hata", s.mesaj);
          yukle();
        },
      },
    ]);
  }

  if (hata) return <Bos metin={hata} />;
  if (!liste) return <Yukleniyor />;
  if (liste.length === 0) return <Bos metin="Kullanıcı yok." />;

  return (
    <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 40 }}>
      {liste.map((k) => (
        <View key={k.id} style={[styles.kart, k.dondurulduMu && { opacity: 0.6 }]}>
          <Text style={styles.kartBaslik}>{k.ad}</Text>
          <Text style={styles.etiket}>{k.email}</Text>
          <Text style={styles.etiket}>
            {k.rol === "yonetici" ? "Yönetici" : "Kullanıcı"} · {k.paket ?? "Paket yok"} · {k.dondurulduMu ? "Dondurulmuş" : "Aktif"}
          </Text>
          {k.rol !== "yonetici" && (
            <Pressable
              onPress={() => dondurDegistir(k)}
              disabled={islemde === k.id}
              style={[styles.ikincilButon, k.dondurulduMu ? styles.acButon : styles.dondurButon]}
            >
              <Text style={[styles.ikincilYazi, { color: k.dondurulduMu ? renk.vurgu : renk.hata }]}>
                {islemde === k.id ? "..." : k.dondurulduMu ? "Hesabı aç" : "Hesabı dondur"}
              </Text>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function KategoriListesi() {
  const [liste, setListe] = useState<{ ad: string; sayi: number }[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, setIslemde] = useState<string | null>(null);

  async function yukle() {
    const s = await istek<{ kanallar: { kategori: string }[] }>("/yonetim/kanallar");
    if (!s.ok) return setHata(s.mesaj);
    const sayilar = new Map<string, number>();
    for (const k of s.veri.kanallar) sayilar.set(k.kategori, (sayilar.get(k.kategori) ?? 0) + 1);
    setListe(
      Array.from(sayilar, ([ad, sayi]) => ({ ad, sayi })).sort((a, b) => a.ad.localeCompare(b.ad, "tr"))
    );
  }

  useEffect(() => {
    yukle();
  }, []);

  function sil(ad: string, sayi: number) {
    Alert.alert("Kategoriyi sil", `"${ad}" kategorisindeki ${sayi} kanal silinecek.`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setIslemde(ad);
          const s = await istek<{ mesaj: string }>(`/yonetim/kategoriler/${encodeURIComponent(ad)}`, undefined, "DELETE");
          setIslemde(null);
          if (!s.ok) return Alert.alert("Hata", s.mesaj);
          yukle();
        },
      },
    ]);
  }

  if (hata) return <Bos metin={hata} />;
  if (!liste) return <Yukleniyor />;
  if (liste.length === 0) return <Bos metin="Kategori yok." />;

  return (
    <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 40 }}>
      {liste.map((k) => (
        <View key={k.ad} style={styles.kart}>
          <Text style={styles.kartBaslik}>{k.ad}</Text>
          <Text style={styles.etiket}>{k.sayi} kanal</Text>
          <Pressable
            onPress={() => sil(k.ad, k.sayi)}
            disabled={islemde === k.ad}
            style={[styles.ikincilButon, styles.dondurButon]}
          >
            <Text style={styles.ikincilYazi}>Kategoriyi sil</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function DestekListesi() {
  const [liste, setListe] = useState<DestekSatiri[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [taslak, setTaslak] = useState<Record<string, string>>({});
  const [gonderiliyor, setGonderiliyor] = useState<string | null>(null);

  async function yukle() {
    const s = await istek<{ mesajlar: DestekSatiri[] }>("/yonetim/destek");
    if (!s.ok) return setHata(s.mesaj);
    setListe(s.veri.mesajlar);
  }

  useEffect(() => {
    yukle();
  }, []);

  async function yanitla(m: DestekSatiri) {
    const yanit = (taslak[m.id] ?? "").trim();
    if (yanit.length < 2) return;
    setGonderiliyor(m.id);
    const s = await istek<{ mesaj: string }>(`/yonetim/destek/${m.id}/yanit`, { yanit }, "POST");
    setGonderiliyor(null);
    if (!s.ok) return Alert.alert("Hata", s.mesaj);
    setTaslak((t) => ({ ...t, [m.id]: "" }));
    Alert.alert("Tamam", s.veri.mesaj);
    yukle();
  }

  if (hata) return <Bos metin={hata} />;
  if (!liste) return <Yukleniyor />;
  if (liste.length === 0) return <Bos metin="Destek mesajı yok." />;

  return (
    <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 40 }}>
      {liste.map((m) => (
        <View key={m.id} style={[styles.kart, m.durum === "yeni" && { borderColor: "rgba(34,211,238,0.4)" }]}>
          <Text style={styles.etiket}>{m.ad}{m.email ? ` · ${m.email}` : ""}</Text>
          <Text style={styles.mesajYazi}>{m.mesaj}</Text>
          {m.yanit ? <Text style={styles.yanitYazi}>Yanıt: {m.yanit}</Text> : null}
          {!m.yanit && (
            <>
              <TextInput
                value={taslak[m.id] ?? ""}
                onChangeText={(t) => setTaslak({ ...taslak, [m.id]: t })}
                placeholder="Yanıtınızı yazın"
                placeholderTextColor={renk.metinCok}
                multiline
                style={styles.input}
              />
              <Pressable
                onPress={() => yanitla(m)}
                disabled={gonderiliyor === m.id || (taslak[m.id] ?? "").trim().length < 2}
                style={[styles.buton, (taslak[m.id] ?? "").trim().length < 2 && { opacity: 0.4 }]}
              >
                <Text style={styles.butonYazi}>{gonderiliyor === m.id ? "Gönderiliyor..." : "Yanıtla"}</Text>
              </Pressable>
            </>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function Bos({ metin }: { metin: string }) {
  return <Text style={styles.bos}>{metin}</Text>;
}
function Yukleniyor() {
  return <ActivityIndicator color={renk.vurgu} style={{ marginTop: 24 }} />;
}

const styles = StyleSheet.create({
  altSekmeSatiri: { flexDirection: "row", gap: 6, marginBottom: bosluk.orta },
  altSekme: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: renk.cizgi, alignItems: "center" },
  altSekmeAktif: { borderColor: renk.vurgu, backgroundColor: "rgba(34,211,238,0.12)" },
  altSekmeYazi: { color: renk.metinSoluk, fontSize: 13 },
  altSekmeYaziAktif: { color: renk.vurgu, fontWeight: "600" },
  bos: { color: renk.metinSoluk, textAlign: "center", marginTop: 32 },
  kart: { backgroundColor: renk.yuzey, borderColor: renk.cizgi, borderWidth: 1, borderRadius: 16, padding: bosluk.orta },
  kartBaslik: { color: renk.metin, fontSize: 15, fontWeight: "600" },
  etiket: { color: renk.metinSoluk, fontSize: 12, marginTop: 4 },
  mesajYazi: { color: renk.metin, fontSize: 14, marginTop: 6, lineHeight: 19 },
  yanitYazi: { color: renk.vurgu, fontSize: 13, marginTop: 8, lineHeight: 18 },
  input: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderColor: renk.cizgi,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: renk.metin,
    marginTop: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  buton: { backgroundColor: renk.vurgu, borderRadius: 999, paddingVertical: 10, alignItems: "center", marginTop: 8 },
  butonYazi: { color: renk.vurguMetin, fontWeight: "600" },
  ikincilButon: { borderWidth: 1, borderRadius: 999, paddingVertical: 9, alignItems: "center", marginTop: 10 },
  dondurButon: { borderColor: "rgba(244,63,94,0.4)" },
  acButon: { borderColor: "rgba(34,211,238,0.4)" },
  ikincilYazi: { fontWeight: "600", fontSize: 13 },
});
