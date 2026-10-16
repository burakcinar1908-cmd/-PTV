import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { istek } from "./api";
import { bosluk, renk } from "./theme";

// Menü içindeki sekmelerin içeriği: Hesabım, Paketler, Destek.

type Kullanici = { id: string; ad: string; email: string; rol: string; emailDogrulandi: boolean };
type Abonelik = { paket: string; ay: number; cihazSiniri: number; bitis: string; saglayici: string } | null;
type Paket = { id: string; ad: string; cihazSiniri: number; sureSecenekleri: { ay: number; fiyat: number }[]; ozellikler: string[] };

function Bos({ metin }: { metin: string }) {
  return <Text style={styles.bos}>{metin}</Text>;
}

function Yukleniyor() {
  return <ActivityIndicator color={renk.vurgu} style={{ marginTop: 24 }} />;
}

export function HesapPanel() {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [abonelik, setAbonelik] = useState<Abonelik | undefined>(undefined);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [k, a] = await Promise.all([
        istek<{ kullanici: Kullanici }>("/auth/ben"),
        istek<{ abonelik: Abonelik }>("/paketler/abonelik"),
      ]);
      if (!k.ok) return setHata(k.mesaj);
      setKullanici(k.veri.kullanici);
      setAbonelik(a.ok ? a.veri.abonelik : null);
    })();
  }, []);

  if (hata) return <Bos metin={hata} />;
  if (!kullanici || abonelik === undefined) return <Yukleniyor />;

  return (
    <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
      <View style={styles.kart}>
        <Text style={styles.etiket}>Ad Soyad</Text>
        <Text style={styles.deger}>{kullanici.ad}</Text>
        <Text style={styles.etiket}>E-posta</Text>
        <Text style={styles.deger}>{kullanici.email}</Text>
        <Text style={styles.etiket}>E-posta durumu</Text>
        <Text style={[styles.deger, { color: kullanici.emailDogrulandi ? renk.vurgu : renk.uyari }]}>
          {kullanici.emailDogrulandi ? "Doğrulandı" : "Doğrulanmadı"}
        </Text>
      </View>

      <View style={styles.kart}>
        <Text style={styles.kartBaslik}>Üyelik</Text>
        {abonelik ? (
          <>
            <Text style={styles.deger}>{abonelik.paket}</Text>
            <Text style={styles.etiket}>Cihaz sınırı: {abonelik.cihazSiniri}</Text>
            <Text style={styles.etiket}>Bitiş: {new Date(abonelik.bitis).toLocaleDateString("tr-TR")}</Text>
          </>
        ) : (
          <Text style={styles.altYazi}>Aktif bir paketiniz yok. Paket satın almak için web sitesini kullanın.</Text>
        )}
      </View>
    </ScrollView>
  );
}

export function PaketPanel() {
  const [paketler, setPaketler] = useState<Paket[] | null>(null);
  const [aktifPaket, setAktifPaket] = useState<{ id: string; ad: string } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<{ tur: "ok" | "hata"; metin: string } | null>(null);
  const [islemde, setIslemde] = useState<string | null>(null);

  async function yukle() {
    const [p, a] = await Promise.all([
      istek<{ paketler: Paket[] }>("/paketler"),
      istek<{ abonelik: { paket: string } | null }>("/paketler/abonelik"),
    ]);
    if (!p.ok) return setHata(p.mesaj);
    setPaketler(p.veri.paketler);
    setAktifPaket(a.ok && a.veri.abonelik ? { id: "", ad: a.veri.abonelik.paket } : null);
  }

  useEffect(() => {
    yukle();
  }, []);

  function satinAl(p: Paket, ay: number) {
    if (aktifPaket) {
      return Alert.alert("Aktif paketiniz var", "Yeni paket almadan önce mevcut paketiniz bitmeli.");
    }
    Alert.alert("Paketi onayla", `${p.ad} – ${ay} ay. Demo modunda ücret alınmaz.`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Onayla",
        onPress: async () => {
          setIslemde(`${p.id}-${ay}`);
          setBilgi(null);
          const s = await istek<{ mesaj: string }>(`/paketler/${p.id}/demo-satin-al`, { ay }, "POST");
          setIslemde(null);
          if (!s.ok) return setBilgi({ tur: "hata", metin: s.mesaj });
          setBilgi({ tur: "ok", metin: s.veri.mesaj });
          yukle();
        },
      },
    ]);
  }

  if (hata) return <Bos metin={hata} />;
  if (!paketler) return <Yukleniyor />;
  if (paketler.length === 0) return <Bos metin="Şu an aktif paket yok." />;

  return (
    <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
      {aktifPaket && (
        <View style={styles.kart}>
          <Text style={styles.altYazi}>Aktif paketiniz: <Text style={{ color: renk.vurgu }}>{aktifPaket.ad}</Text></Text>
        </View>
      )}
      {bilgi && (
        <View style={[styles.bilgiKutu, bilgi.tur === "hata" && styles.bilgiHata]}>
          <Text style={{ color: bilgi.tur === "ok" ? renk.vurgu : renk.hata, fontSize: 13, lineHeight: 18 }}>{bilgi.metin}</Text>
        </View>
      )}
      {paketler.map((p) => (
        <View key={p.id} style={styles.kart}>
          <Text style={styles.kartBaslik}>{p.ad}</Text>
          <Text style={styles.etiket}>{p.cihazSiniri} cihaz</Text>
          {p.ozellikler.map((o) => (
            <Text key={o} style={styles.ozellik}>• {o}</Text>
          ))}
          <Text style={[styles.etiket, { marginTop: bosluk.orta }]}>Süre seç</Text>
          <View style={styles.sureSatiri}>
            {p.sureSecenekleri.map((s) => {
              const bekliyor = islemde === `${p.id}-${s.ay}`;
              return (
                <Pressable
                  key={s.ay}
                  onPress={() => satinAl(p, s.ay)}
                  disabled={islemde !== null}
                  style={({ pressed }) => [styles.sureRozet, pressed && { opacity: 0.7 }, islemde !== null && { opacity: 0.4 }]}
                >
                  <Text style={styles.sureYazi}>{bekliyor ? "..." : `${s.ay} ay`}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export function DestekPanel() {
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [bilgi, setBilgi] = useState<{ tur: "ok" | "hata"; metin: string } | null>(null);

  const hazir = ad.trim().length >= 2 && mesaj.trim().length >= 5 && !gonderiliyor;

  async function gonder() {
    if (!hazir) return;
    setGonderiliyor(true);
    setBilgi(null);
    const s = await istek<{ mesaj: string }>("/destek", { ad: ad.trim(), email: email.trim(), mesaj: mesaj.trim() }, "POST");
    setGonderiliyor(false);
    if (!s.ok) return setBilgi({ tur: "hata", metin: s.mesaj });
    setBilgi({ tur: "ok", metin: s.veri.mesaj });
    setMesaj("");
  }

  return (
    <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
      <View style={styles.kart}>
        <Text style={styles.kartBaslik}>Bize yazın</Text>
        <Text style={styles.etiket}>Ad</Text>
        <TextInput value={ad} onChangeText={setAd} placeholder="Adınız" placeholderTextColor={renk.metinCok} style={styles.input} />
        <Text style={styles.etiket}>E-posta (isteğe bağlı)</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="ornek@mail.com" placeholderTextColor={renk.metinCok} style={styles.input} />
        <Text style={styles.etiket}>Mesajınız</Text>
        <TextInput value={mesaj} onChangeText={setMesaj} multiline placeholder="Sorununuzu yazın" placeholderTextColor={renk.metinCok} style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]} />

        {bilgi && (
          <Text style={[styles.altYazi, { color: bilgi.tur === "ok" ? renk.vurgu : renk.hata, marginTop: 10 }]}>{bilgi.metin}</Text>
        )}

        <Pressable onPress={gonder} disabled={!hazir} style={[styles.buton, !hazir && { opacity: 0.4 }]}>
          <Text style={styles.butonYazi}>{gonderiliyor ? "Gönderiliyor..." : "Gönder"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bos: { color: renk.metinSoluk, textAlign: "center", marginTop: 32, lineHeight: 20 },
  kart: { backgroundColor: renk.yuzey, borderColor: renk.cizgi, borderWidth: 1, borderRadius: 16, padding: bosluk.orta },
  kartBaslik: { color: renk.metin, fontSize: 16, fontWeight: "600", marginBottom: 6 },
  etiket: { color: renk.metinSoluk, fontSize: 12, marginTop: bosluk.kucuk },
  deger: { color: renk.metin, fontSize: 15, marginTop: 2 },
  altYazi: { color: renk.metinSoluk, fontSize: 13, lineHeight: 18 },
  ozellik: { color: "#cbd5e1", fontSize: 13, marginTop: 4 },
  sureSatiri: { flexDirection: "row", gap: 8, marginTop: bosluk.kucuk + 4, flexWrap: "wrap" },
  sureRozet: { borderColor: "rgba(34,211,238,0.4)", borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  sureYazi: { color: renk.vurgu, fontSize: 13, fontWeight: "600" },
  bilgiKutu: { backgroundColor: "rgba(34,211,238,0.08)", borderColor: "rgba(34,211,238,0.3)", borderWidth: 1, borderRadius: 12, padding: 10 },
  bilgiHata: { backgroundColor: "rgba(244,63,94,0.08)", borderColor: "rgba(244,63,94,0.35)" },
  input: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderColor: renk.cizgi,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: bosluk.orta,
    paddingVertical: 10,
    color: renk.metin,
    fontSize: 15,
    marginTop: 4,
  },
  buton: { backgroundColor: renk.vurgu, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginTop: bosluk.orta },
  butonYazi: { color: renk.vurguMetin, fontWeight: "600", fontSize: 15 },
});
