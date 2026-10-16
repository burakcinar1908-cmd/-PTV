import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { kayitOl } from "./api";
import { bosluk, renk } from "./theme";

export default function Kayit({ onGeri, onDogrula }: { onGeri: () => void; onDogrula: () => void }) {
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basarili, setBasarili] = useState<string | null>(null);

  // Sunucuyla aynı kurallar: ad 2+, geçerli e-posta, şifre 8+ ve en az bir harf.
  const adGecerli = ad.trim().length >= 2;
  const emailGecerli = /^\S+@\S+\.\S+$/.test(email.trim());
  const sifreGecerli = sifre.length >= 8 && /[A-Za-z]/.test(sifre);
  const eslesiyor = sifre === sifreTekrar && sifreTekrar.length > 0;
  const hazir = adGecerli && emailGecerli && sifreGecerli && eslesiyor && !yukleniyor;

  async function gonder() {
    if (!hazir) return;
    setHata(null);
    setYukleniyor(true);
    const s = await kayitOl(ad.trim(), email.trim(), sifre);
    setYukleniyor(false);
    if (!s.ok) return setHata(s.mesaj);
    setBasarili(s.veri.mesaj);
  }

  if (basarili) {
    return (
      <View style={styles.kapsayici}>
        <Text style={styles.baslik}>Neredeyse tamam</Text>
        <View style={styles.kart}>
          <Text style={styles.basariYazi}>{basarili}</Text>
          <Text style={styles.altYazi}>
            E-postanı aç, doğrulama bağlantısına tıkla (24 saat geçerli). Sonra buradan giriş yap.
          </Text>
          <Pressable onPress={onDogrula} style={styles.buton}>
            <Text style={styles.butonYazi}>Doğrulama bağlantısını gir</Text>
          </Pressable>
          <Pressable onPress={onGeri} style={styles.geriBag}>
            <Text style={styles.geriBagYazi}>Girişe dön</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kapsayici}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
        <Text style={styles.baslik}>Kayıt ol</Text>
        <Text style={styles.altBaslik}>Hesap oluştur, e-postanı doğrula</Text>

        <View style={styles.kart}>
          <Text style={styles.etiket}>Ad Soyad</Text>
          <TextInput value={ad} onChangeText={setAd} placeholder="Adın" placeholderTextColor={renk.metinCok} style={styles.input} />

          <Text style={styles.etiket}>E-posta</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="ornek@mail.com" placeholderTextColor={renk.metinCok} style={styles.input} />

          <Text style={styles.etiket}>Şifre</Text>
          <TextInput value={sifre} onChangeText={setSifre} secureTextEntry placeholder="En az 8 karakter, bir harf" placeholderTextColor={renk.metinCok} style={styles.input} />

          <Text style={styles.etiket}>Şifre tekrar</Text>
          <TextInput value={sifreTekrar} onChangeText={setSifreTekrar} secureTextEntry placeholder="Şifreyi tekrar yaz" placeholderTextColor={renk.metinCok} style={styles.input} />

          {!eslesiyor && sifreTekrar.length > 0 && <Text style={styles.ipucu}>Şifreler eşleşmiyor.</Text>}
          {sifre.length > 0 && !sifreGecerli && <Text style={styles.ipucu}>Şifre en az 8 karakter ve bir harf içermeli.</Text>}

          {hata && (
            <View style={styles.hataKutu}>
              <Text style={styles.hataYazi}>{hata}</Text>
            </View>
          )}

          <Pressable onPress={gonder} disabled={!hazir} style={[styles.buton, !hazir && { opacity: 0.4 }]}>
            {yukleniyor ? <ActivityIndicator color={renk.vurguMetin} /> : <Text style={styles.butonYazi}>Hesap oluştur</Text>}
          </Pressable>

          <Pressable onPress={onGeri} style={styles.geriBag}>
            <Text style={styles.geriBagYazi}>Zaten hesabım var, giriş yap</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: renk.zemin, paddingHorizontal: bosluk.buyuk, justifyContent: "center" },
  baslik: { color: renk.metin, fontSize: 26, fontWeight: "600", textAlign: "center" },
  altBaslik: { color: renk.metinSoluk, fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: bosluk.buyuk },
  altYazi: { color: renk.metinSoluk, fontSize: 13, lineHeight: 19, marginTop: bosluk.orta },
  kart: { backgroundColor: renk.yuzey, borderColor: renk.cizgi, borderWidth: 1, borderRadius: 20, padding: bosluk.buyuk, marginTop: bosluk.orta },
  etiket: { color: renk.metinSoluk, fontSize: 12, marginBottom: 6, marginTop: bosluk.kucuk },
  input: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderColor: renk.cizgi,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: bosluk.orta,
    paddingVertical: 12,
    color: renk.metin,
    fontSize: 15,
  },
  ipucu: { color: renk.uyari, fontSize: 12, marginTop: 6 },
  hataKutu: { marginTop: bosluk.orta, backgroundColor: "rgba(244,63,94,0.08)", borderColor: "rgba(244,63,94,0.35)", borderWidth: 1, borderRadius: 12, padding: 10 },
  hataYazi: { color: renk.hata, fontSize: 13, lineHeight: 18 },
  basariYazi: { color: renk.vurgu, fontSize: 15, lineHeight: 21 },
  buton: { backgroundColor: renk.vurgu, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: bosluk.buyuk },
  butonYazi: { color: renk.vurguMetin, fontWeight: "600", fontSize: 16 },
  geriBag: { alignItems: "center", marginTop: bosluk.orta },
  geriBagYazi: { color: renk.vurgu, fontSize: 14 },
});
