import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { giris } from "./api";

export default function Giris({ onGirisYapildi }: { onGirisYapildi: () => void }) {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder() {
    setHata(null);
    setYukleniyor(true);
    const s = await giris(email.trim(), sifre);
    setYukleniyor(false);
    if (!s.ok) return setHata(s.mesaj);
    onGirisYapildi();
  }

  return (
    <View style={styles.kapsayici}>
      <Text style={styles.baslik}>Giriş yap</Text>
      <TextInput
        placeholder="E-posta"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Şifre"
        placeholderTextColor="#64748b"
        secureTextEntry
        value={sifre}
        onChangeText={setSifre}
        style={styles.input}
      />
      {hata && <Text style={styles.hata}>{hata}</Text>}
      <Pressable onPress={gonder} disabled={yukleniyor} style={styles.buton}>
        {yukleniyor ? <ActivityIndicator color="#020617" /> : <Text style={styles.butonYazi}>Giriş yap</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: "#05060a", justifyContent: "center", paddingHorizontal: 24, gap: 12 },
  baslik: { color: "#f1f5f9", fontSize: 28, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#f1f5f9",
  },
  hata: { color: "#fecdd3" },
  buton: { backgroundColor: "#22d3ee", borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  butonYazi: { color: "#020617", fontWeight: "600", fontSize: 16 },
});
