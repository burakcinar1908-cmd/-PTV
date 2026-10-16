import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { istek, type Kanal } from "./api";
import { KanalKarti } from "./KanalKarti";
import { DestekPanel, HesapPanel, PaketPanel } from "./Panel";
import Admin from "./Admin";
import { bosluk, renk } from "./theme";

type Liste = { kanallar: Kanal[]; kategoriler: string[]; paketGerekli: boolean };
type Mesaj = { tur: "hata" | "uyari"; metin: string };
type Sekme = "kategori" | "hesap" | "paket" | "destek" | "yonetim";
const SEKMELER: { id: Sekme; ad: string }[] = [
  { id: "kategori", ad: "Kategoriler" },
  { id: "hesap", ad: "Hesabım" },
  { id: "paket", ad: "Paketler" },
  { id: "destek", ad: "Destek" },
];
const YONETIM_SEKMESI = { id: "yonetim" as Sekme, ad: "Yönetim" };

export default function Kanallar({ onSec, onCikis }: { onSec: (k: Kanal) => void; onCikis: () => void }) {
  const [kanallar, setKanallar] = useState<Kanal[]>([]);
  const [kategoriler, setKategoriler] = useState<string[]>([]);
  const [kategori, setKategori] = useState("");
  const [arama, setArama] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [menuAcik, setMenuAcik] = useState(false);
  const [sekme, setSekme] = useState<Sekme>("kategori");
  const [yonetici, setYonetici] = useState(false);

  // Yönetim sekmesi yalnızca yönetici hesabında görünür.
  useEffect(() => {
    istek<{ kullanici: { rol: string } }>("/auth/ben").then((s) => {
      if (s.ok && s.veri.kullanici.rol === "yonetici") setYonetici(true);
    });
  }, []);

  const sekmeListesi = yonetici ? [...SEKMELER, YONETIM_SEKMESI] : SEKMELER;
  const [mesaj, setMesaj] = useState<Mesaj | null>(null);

  // Her tuşta değil, yazma durunca istek at (250 ms).
  useEffect(() => {
    let iptal = false;
    const zamanlayici = setTimeout(async () => {
      setYukleniyor(true);
      const params = new URLSearchParams();
      if (kategori) params.set("kategori", kategori);
      if (arama.trim()) params.set("q", arama.trim());
      const s = await istek<Liste>(`/kanallar?${params.toString()}`);
      if (iptal) return;
      setYukleniyor(false);
      if (!s.ok) return setMesaj({ tur: "hata", metin: s.mesaj });
      setMesaj(s.veri.paketGerekli ? { tur: "uyari", metin: "Kanalları görmek için web sitesinden bir paket seçin." } : null);
      setKanallar(s.veri.kanallar);
      // Kategori listesi filtreye göre daralmasın diye sadece ilk tam yüklemede güncellenir.
      if (!kategori && !arama.trim()) setKategoriler(s.veri.kategoriler);
    }, 250);
    return () => {
      iptal = true;
      clearTimeout(zamanlayici);
    };
  }, [kategori, arama]);

  const kategoriListesi = useMemo(() => ["", ...kategoriler], [kategoriler]);

  const menuAc = useCallback(() => {
    setSekme("kategori");
    setMenuAcik(true);
  }, []);

  const kategoriSec = useCallback((k: string) => {
    setKategori(k);
    setMenuAcik(false);
  }, []);

  const cikisYap = useCallback(() => {
    setMenuAcik(false);
    onCikis();
  }, [onCikis]);

  const renderKart = useCallback(({ item }: { item: Kanal }) => <KanalKarti kanal={item} onSec={onSec} />, [onSec]);

  return (
    <View style={styles.kapsayici}>
      <View style={styles.ustSatir}>
        <Pressable onPress={menuAc} style={styles.hamburger} hitSlop={10} accessibilityLabel="Menü">
          <View style={styles.cizgi} />
          <View style={styles.cizgi} />
          <View style={styles.cizgi} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.baslik} numberOfLines={1}>{kategori || "Kanallar"}</Text>
          {!yukleniyor && !mesaj && <Text style={styles.sayac}>{kanallar.length} kanal</Text>}
        </View>
      </View>

      <TextInput
        placeholder="Kanal ara..."
        placeholderTextColor={renk.metinCok}
        value={arama}
        onChangeText={setArama}
        autoCorrect={false}
        style={styles.arama}
      />

      {mesaj && (
        <View style={[styles.mesajKutu, mesaj.tur === "hata" ? styles.mesajHata : styles.mesajUyari]}>
          <Text style={[styles.mesajYazi, { color: mesaj.tur === "hata" ? renk.hata : renk.uyari }]}>{mesaj.metin}</Text>
        </View>
      )}

      {yukleniyor ? (
        <ActivityIndicator color={renk.vurgu} style={{ marginTop: 24 }} />
      ) : kanallar.length === 0 && !mesaj ? (
        <Text style={styles.bos}>Bu filtrede kanal yok.</Text>
      ) : (
        <FlatList
          data={kanallar}
          keyExtractor={(k) => k.id}
          renderItem={renderKart}
          numColumns={2}
          columnWrapperStyle={styles.satir}
          contentContainerStyle={styles.liste}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      <Modal visible={menuAcik} animationType="slide" onRequestClose={() => setMenuAcik(false)}>
        <View style={styles.menuKok}>
          <View style={styles.menuUst}>
            <Text style={styles.menuBaslik}>Menü</Text>
            <Pressable onPress={() => setMenuAcik(false)} hitSlop={10} style={styles.kapat}>
              <Text style={styles.kapatYazi}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.sekmeSatiri}>
            {sekmeListesi.map((k) => {
              const aktif = sekme === k.id;
              return (
                <Pressable key={k.id} onPress={() => setSekme(k.id)} style={[styles.sekme, aktif && styles.sekmeAktif]}>
                  <Text style={[styles.sekmeYazi, aktif && styles.sekmeYaziAktif]}>{k.ad}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.menuIcerik}>
            {sekme === "kategori" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {kategoriListesi.map((k) => {
                  const aktif = kategori === k;
                  return (
                    <Pressable key={k || "tumu"} onPress={() => kategoriSec(k)} style={[styles.menuSatir, aktif && styles.menuSatirAktif]}>
                      <Text style={[styles.menuSatirYazi, aktif && styles.menuSatirYaziAktif]} numberOfLines={1}>{k || "Tümü"}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            {sekme === "hesap" && <HesapPanel />}
            {sekme === "paket" && <PaketPanel />}
            {sekme === "destek" && <DestekPanel />}
            {sekme === "yonetim" && yonetici && <Admin />}
          </View>

          <Pressable onPress={cikisYap} style={styles.cikisButon}>
            <Text style={styles.cikisYazi}>Çıkış yap</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: renk.zemin, paddingTop: 56, paddingHorizontal: bosluk.orta },
  ustSatir: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: bosluk.orta },
  hamburger: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: renk.yuzey,
    borderColor: renk.cizgi,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cizgi: { width: 18, height: 2, borderRadius: 2, backgroundColor: renk.metin },
  baslik: { color: renk.metin, fontSize: 22, fontWeight: "600" },
  sayac: { color: renk.metinCok, fontSize: 12, marginTop: 2 },
  arama: {
    backgroundColor: renk.yuzey,
    borderColor: renk.cizgi,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: bosluk.orta,
    paddingVertical: 12,
    color: renk.metin,
    marginBottom: 12,
  },
  mesajKutu: { borderRadius: 14, borderWidth: 1, padding: bosluk.orta - 2, marginBottom: 8 },
  mesajHata: { backgroundColor: "rgba(244,63,94,0.08)", borderColor: "rgba(244,63,94,0.35)" },
  mesajUyari: { backgroundColor: "rgba(252,211,77,0.08)", borderColor: "rgba(252,211,77,0.3)" },
  mesajYazi: { fontSize: 13, lineHeight: 18 },
  bos: { color: renk.metinSoluk, textAlign: "center", marginTop: 32 },
  satir: { gap: 12 },
  liste: { gap: 12, paddingBottom: 48 },

  menuKok: { flex: 1, backgroundColor: renk.zemin, paddingTop: 56, paddingHorizontal: bosluk.orta, paddingBottom: bosluk.orta },
  menuUst: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: bosluk.orta },
  menuBaslik: { color: renk.metin, fontSize: 22, fontWeight: "600" },
  kapat: { width: 40, height: 40, borderRadius: 12, backgroundColor: renk.yuzey, borderColor: renk.cizgi, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  kapatYazi: { color: renk.metin, fontSize: 16 },
  sekmeSatiri: { flexDirection: "row", gap: 6, marginBottom: bosluk.orta },
  sekme: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: renk.yuzey, borderColor: renk.cizgi, borderWidth: 1, alignItems: "center" },
  sekmeAktif: { backgroundColor: renk.vurgu, borderColor: renk.vurgu },
  sekmeYazi: { color: "#cbd5e1", fontSize: 12 },
  sekmeYaziAktif: { color: renk.vurguMetin, fontWeight: "600" },
  menuIcerik: { flex: 1 },
  menuSatir: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 4 },
  menuSatirAktif: { backgroundColor: "rgba(34,211,238,0.12)" },
  menuSatirYazi: { color: "#cbd5e1", fontSize: 15 },
  menuSatirYaziAktif: { color: renk.vurgu, fontWeight: "600" },
  cikisButon: { marginTop: bosluk.kucuk, borderColor: "rgba(244,63,94,0.4)", borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  cikisYazi: { color: renk.hata, fontWeight: "600" },
});
