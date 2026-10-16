import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { dogrulamaTekrarGonder, giris, sifreSifirlaIste } from "./api";
import { bosluk, renk } from "./theme";

export default function Giris({ onGirisYapildi, onKayit, onDogrula }: { onGirisYapildi: () => void; onKayit: () => void; onDogrula: () => void }) {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);

  const hazir = email.trim().length > 0 && sifre.length > 0 && !yukleniyor;

  async function gonder() {
    if (!hazir) return;
    setHata(null);
    setBilgi(null);
    setYukleniyor(true);
    const s = await giris(email.trim(), sifre);
    setYukleniyor(false);
    if (!s.ok) return setHata(s.mesaj);
    onGirisYapildi();
  }

  // Hesap var ama e-posta doğrulanmamış: bağlantıyı yeniden isteme seçeneği.
  const dogrulamaGerekli = hata?.includes("doğrulayın") ?? false;

  async function dogrulamaYenile() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return;
    setYukleniyor(true);
    const s = await dogrulamaTekrarGonder(email.trim());
    setYukleniyor(false);
    setBilgi(s.ok ? s.veri.mesaj : s.mesaj);
  }

  async function sifremiUnuttum() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return setHata("Şifre sıfırlamak için önce e-posta adresini yaz.");
    }
    setHata(null);
    const s = await sifreSifirlaIste(email.trim());
    setBilgi(s.ok ? s.veri.mesaj : s.mesaj);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kapsayici}>
      <View style={styles.logo}>
        <Text style={styles.logoYazi}>IPTV</Text>
      </View>
      <Text style={styles.baslik}>Hoş geldin</Text>
      <Text style={styles.altBaslik}>Hesabınla giriş yap</Text>

      <View style={styles.kart}>
        <Text style={styles.etiket}>E-posta</Text>
        <TextInput
          placeholder="ornek@mail.com"
          placeholderTextColor={renk.metinCok}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <Text style={styles.etiket}>Şifre</Text>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor={renk.metinCok}
          secureTextEntry
          autoComplete="password"
          value={sifre}
          onChangeText={setSifre}
          onSubmitEditing={gonder}
          style={styles.input}
        />

        {hata && (
          <View style={styles.hataKutu}>
            <Text style={styles.hataYazi}>{hata}</Text>
          </View>
        )}
        {bilgi && (
          <View style={styles.bilgiKutu}>
            <Text style={styles.bilgiYazi}>{bilgi}</Text>
          </View>
        )}

        {dogrulamaGerekli && (
          <Pressable onPress={dogrulamaYenile} style={styles.ikincilButon}>
            <Text style={styles.ikincilYazi}>Doğrulama e-postasını tekrar gönder</Text>
          </Pressable>
        )}

        <Pressable onPress={gonder} disabled={!hazir} style={({ pressed }) => [styles.buton, !hazir && styles.butonPasif, pressed && styles.butonBasili]}>
          {yukleniyor ? <ActivityIndicator color={renk.vurguMetin} /> : <Text style={styles.butonYazi}>Giriş yap</Text>}
        </Pressable>

        <View style={styles.altSatir}>
          <Pressable onPress={sifremiUnuttum} hitSlop={8}>
            <Text style={styles.link}>Şifremi unuttum</Text>
          </Pressable>
          <Pressable onPress={onDogrula} hitSlop={8}>
            <Text style={styles.link}>Doğrulama</Text>
          </Pressable>
          <Pressable onPress={onKayit} hitSlop={8}>
            <Text style={styles.link}>Kayıt ol</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: renk.zemin, justifyContent: "center", paddingHorizontal: bosluk.buyuk },
  logo: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: bosluk.orta,
  },
  logoYazi: { color: renk.vurgu, fontWeight: "700", fontSize: 16, letterSpacing: 2 },
  baslik: { color: renk.metin, fontSize: 26, fontWeight: "600", textAlign: "center" },
  altBaslik: { color: renk.metinSoluk, fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: bosluk.buyuk },
  kart: { backgroundColor: renk.yuzey, borderColor: renk.cizgi, borderWidth: 1, borderRadius: 20, padding: bosluk.buyuk },
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
  hataKutu: { marginTop: bosluk.orta, backgroundColor: "rgba(244,63,94,0.08)", borderColor: "rgba(244,63,94,0.35)", borderWidth: 1, borderRadius: 12, padding: 10 },
  hataYazi: { color: renk.hata, fontSize: 13, lineHeight: 18 },
  bilgiKutu: { marginTop: bosluk.orta, backgroundColor: "rgba(34,211,238,0.08)", borderColor: "rgba(34,211,238,0.3)", borderWidth: 1, borderRadius: 12, padding: 10 },
  bilgiYazi: { color: renk.vurgu, fontSize: 13, lineHeight: 18 },
  buton: { backgroundColor: renk.vurgu, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: bosluk.buyuk },
  butonPasif: { opacity: 0.4 },
  butonBasili: { opacity: 0.85 },
  butonYazi: { color: renk.vurguMetin, fontWeight: "600", fontSize: 16 },
  altSatir: { flexDirection: "row", justifyContent: "space-between", marginTop: bosluk.orta },
  link: { color: renk.vurgu, fontSize: 13 },
  ikincilButon: { borderColor: renk.vurgu, borderWidth: 1, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginTop: bosluk.orta },
  ikincilYazi: { color: renk.vurgu, fontWeight: "600", fontSize: 14 },
});
