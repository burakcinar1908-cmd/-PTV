import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { cikisYap, oturumDustuDinle, tokenOku, type Kanal } from "./src/api";
import Giris from "./src/Giris";
import Kayit from "./src/Kayit";
import Dogrula from "./src/Dogrula";
import Kanallar from "./src/Kanallar";
import Oynatici from "./src/Oynatici";
import { bosluk, renk } from "./src/theme";

type Ekran =
  | { tur: "yukleniyor" }
  | { tur: "giris" }
  | { tur: "kayit" }
  | { tur: "dogrula" }
  | { tur: "liste" }
  | { tur: "izle"; kanal: Kanal };

export default function App() {
  const [ekran, setEkran] = useState<Ekran>({ tur: "yukleniyor" });

  useEffect(() => {
    tokenOku().then((t) => setEkran(t ? { tur: "liste" } : { tur: "giris" }));
    // Sunucu 401 dönerse (oturum süresi doldu / hesap dondu) giriş ekranına dön.
    oturumDustuDinle(() => setEkran({ tur: "giris" }));
  }, []);

  async function cikis() {
    await cikisYap();
    setEkran({ tur: "giris" });
  }

  return (
    <View style={styles.kok}>
      <StatusBar style="light" />
      {ekran.tur === "yukleniyor" && (
        <View style={styles.yukleniyor}>
          <View style={styles.logo}>
            <Text style={styles.logoYazi}>IPTV</Text>
          </View>
          <ActivityIndicator color={renk.vurgu} style={{ marginTop: bosluk.orta }} />
        </View>
      )}
      {ekran.tur === "giris" && (
        <Giris
          onGirisYapildi={() => setEkran({ tur: "liste" })}
          onKayit={() => setEkran({ tur: "kayit" })}
          onDogrula={() => setEkran({ tur: "dogrula" })}
        />
      )}
      {ekran.tur === "kayit" && (
        <Kayit onGeri={() => setEkran({ tur: "giris" })} onDogrula={() => setEkran({ tur: "dogrula" })} />
      )}
      {ekran.tur === "dogrula" && <Dogrula onGeri={() => setEkran({ tur: "giris" })} />}
      {ekran.tur === "liste" && <Kanallar onSec={(kanal) => setEkran({ tur: "izle", kanal })} onCikis={cikis} />}
      {ekran.tur === "izle" && <Oynatici kanal={ekran.kanal} onGeri={() => setEkran({ tur: "liste" })} />}
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  yukleniyor: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoYazi: { color: renk.vurgu, fontWeight: "700", fontSize: 16, letterSpacing: 2 },
});
