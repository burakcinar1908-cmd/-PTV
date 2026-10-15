import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { istek, type Kanal } from "./api";

type Liste = { kanallar: Kanal[]; kategoriler: string[]; paketGerekli: boolean };

export default function Kanallar({ onSec, onCikis }: { onSec: (k: Kanal) => void; onCikis: () => void }) {
  const [kanallar, setKanallar] = useState<Kanal[]>([]);
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [kategori, setKategori] = useState("");
  const [arama, setArama] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState<string | null>(null);

  useEffect(() => {
    const zamanlayici = setTimeout(async () => {
      setYukleniyor(true);
      const params = new URLSearchParams();
      if (kategori) params.set("kategori", kategori);
      if (arama.trim()) params.set("q", arama.trim());
      const s = await istek<Liste>(`/kanallar?${params.toString()}`);
      setYukleniyor(false);
      if (!s.ok) return setMesaj(s.mesaj);
      setMesaj(s.veri.paketGerekli ? "Kanalları görmek için web sitesinden bir paket seçin." : null);
      setKanallar(s.veri.kanallar);
      setKategoriler(s.veri.kategoriler);
    }, 250);
    return () => clearTimeout(zamanlayici);
  }, [kategori, arama]);

  const kategoriListesi = useMemo(() => ["", ...kategoriler], [kategoriler]);

  return (
    <View style={styles.kapsayici}>
      <View style={styles.ustSatir}>
        <Text style={styles.baslik}>Kanallar</Text>
        <Pressable onPress={onCikis}>
          <Text style={styles.cikis}>Çıkış</Text>
        </Pressable>
      </View>

      <TextInput
        placeholder="Kanal ara..."
        placeholderTextColor="#64748b"
        value={arama}
        onChangeText={setArama}
        style={styles.arama}
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={kategoriListesi}
        keyExtractor={(k) => k || "tumu"}
        contentContainerStyle={styles.chipSatiri}
        renderItem={({ item }) => {
          const aktif = kategori === item;
          return (
            <Pressable onPress={() => setKategori(item)} style={[styles.chip, aktif && styles.chipAktif]}>
              <Text style={[styles.chipYazi, aktif && styles.chipYaziAktif]}>{item || "Tümü"}</Text>
            </Pressable>
          );
        }}
      />

      {yukleniyor && <ActivityIndicator color="#22d3ee" style={{ marginTop: 24 }} />}
      {mesaj && <Text style={styles.mesaj}>{mesaj}</Text>}

      {!yukleniyor && (
        <FlatList
          data={kanallar}
          keyExtractor={(k) => k.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 48 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => onSec(item)} style={styles.kart}>
              <View style={styles.logoKutu}>
                <Text style={styles.logoHarf}>{item.ad.charAt(0)}</Text>
              </View>
              <Text style={styles.kategoriEtiket}>{item.kategori}</Text>
              <Text style={styles.kanalAd} numberOfLines={1}>{item.ad}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: "#05060a", paddingTop: 56, paddingHorizontal: 16 },
  ustSatir: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  baslik: { color: "#f1f5f9", fontSize: 28, fontWeight: "600" },
  cikis: { color: "#94a3b8", fontSize: 14 },
  arama: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#f1f5f9",
    marginBottom: 12,
  },
  chipSatiri: { gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
  },
  chipAktif: { backgroundColor: "#22d3ee", borderColor: "#22d3ee" },
  chipYazi: { color: "#cbd5e1", fontSize: 14 },
  chipYaziAktif: { color: "#020617", fontWeight: "600" },
  mesaj: { color: "#fcd34d", marginTop: 12, lineHeight: 20 },
  kart: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  logoKutu: {
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: "rgba(34,211,238,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  logoHarf: { color: "rgba(165,243,252,0.8)", fontSize: 28, fontWeight: "600" },
  kategoriEtiket: { color: "#67e8f9", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },
  kanalAd: { color: "#f1f5f9", fontSize: 15, marginTop: 4 },
});
