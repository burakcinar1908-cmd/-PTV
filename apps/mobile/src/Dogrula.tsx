import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { dogrulaToken } from "./api";
import { bosluk, renk } from "./theme";

// E-postadaki bağlantının tamamını ya da sadece token'ı kabul eder.
function tokenCikar(girdi: string): string {
  const t = girdi.trim();
  const eslesme = t.match(/token=([a-f0-9]+)/i);
  return eslesme ? eslesme[1] : t;
}

export default function Dogrula({ onGeri }: { onGeri: () => void }) {
  const [girdi, setGirdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basarili, setBasarili] = useState<string | null>(null);

  const hazir = tokenCikar(girdi).length >= 20 && !yukleniyor;

  async function gonder() {
    if (!hazir) return;
    setHata(null);
    setYukleniyor(true);
    const s = await dogrulaToken(tokenCikar(girdi));
    setYukleniyor(false);
    if (!s.ok) return setHata(s.mesaj);
    setBasarili(s.veri.mesaj);
  }

  if (basarili) {
    return (
      <View style={styles.kapsayici}>
        <Text style={styles.baslik}>Doğrulandı</Text>
        <View style={styles.kart}>
          <Text style={styles.basari}>{basarili}</Text>
          <Pressable onPress={onGeri} style={styles.buton}>
            <Text style={styles.butonYazi}>Girişe git</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kapsayici}>
      <Text style={styles.baslik}>E-postanı doğrula</Text>
      <Text style={styles.altBaslik}>Mailindeki bağlantıyı yapıştır. Tüm bağlantı ya da sadece kod olabilir.</Text>
      <View style={styles.kart}>
        <Text style={styles.etiket}>Bağlantı veya kod</Text>
        <TextInput
          value={girdi}
          onChangeText={setGirdi}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          placeholder="https://iptv-web-nach.onrender.com/dogrula?token=..."
          placeholderTextColor={renk.metinCok}
          style={styles.input}
        />
        {hata && (
          <View style={styles.hataKutu}>
            <Text style={styles.hataYazi}>{hata}</Text>
          </View>
        )}
        <Pressable onPress={gonder} disabled={!hazir} style={[styles.buton, !hazir && { opacity: 0.4 }]}>
          {yukleniyor ? <ActivityIndicator color={renk.vurguMetin} /> : <Text style={styles.butonYazi}>Doğrula</Text>}
        </Pressable>
        <Pressable onPress={onGeri} style={styles.geri}>
          <Text style={styles.geriYazi}>Girişe dön</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: renk.zemin, justifyContent: "center", paddingHorizontal: bosluk.buyuk },
  baslik: { color: renk.metin, fontSize: 26, fontWeight: "600", textAlign: "center" },
  altBaslik: { color: renk.metinSoluk, fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: bosluk.orta, lineHeight: 20 },
  kart: { backgroundColor: renk.yuzey, borderColor: renk.cizgi, borderWidth: 1, borderRadius: 20, padding: bosluk.buyuk, marginTop: bosluk.orta },
  etiket: { color: renk.metinSoluk, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderColor: renk.cizgi,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: bosluk.orta,
    paddingVertical: 12,
    color: renk.metin,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  hataKutu: { marginTop: bosluk.orta, backgroundColor: "rgba(244,63,94,0.08)", borderColor: "rgba(244,63,94,0.35)", borderWidth: 1, borderRadius: 12, padding: 10 },
  hataYazi: { color: renk.hata, fontSize: 13, lineHeight: 18 },
  basari: { color: renk.vurgu, fontSize: 15, lineHeight: 21 },
  buton: { backgroundColor: renk.vurgu, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: bosluk.buyuk },
  butonYazi: { color: renk.vurguMetin, fontWeight: "600", fontSize: 16 },
  geri: { alignItems: "center", marginTop: bosluk.orta },
  geriYazi: { color: renk.vurgu, fontSize: 14 },
});
