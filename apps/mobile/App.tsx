import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { tokenOku, tokenSil, type Kanal } from "./src/api";
import Giris from "./src/Giris";
import Kanallar from "./src/Kanallar";
import Oynatici from "./src/Oynatici";

type Ekran = { tur: "yukleniyor" } | { tur: "giris" } | { tur: "liste" } | { tur: "izle"; kanal: Kanal };

export default function App() {
  const [ekran, setEkran] = useState<Ekran>({ tur: "yukleniyor" });

  useEffect(() => {
    tokenOku().then((t) => setEkran(t ? { tur: "liste" } : { tur: "giris" }));
  }, []);

  async function cikis() {
    // Sunucu oturumu zamanla kendiliğinden düşer; yerel belirteci siliyoruz.
    await tokenSil();
    setEkran({ tur: "giris" });
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#05060a" }}>
      <StatusBar style="light" />
      {ekran.tur === "yukleniyor" && <ActivityIndicator style={{ flex: 1 }} color="#22d3ee" />}
      {ekran.tur === "giris" && <Giris onGirisYapildi={() => setEkran({ tur: "liste" })} />}
      {ekran.tur === "liste" && (
        <Kanallar onSec={(kanal) => setEkran({ tur: "izle", kanal })} onCikis={cikis} />
      )}
      {ekran.tur === "izle" && (
        <Oynatici kanal={ekran.kanal} onGeri={() => setEkran({ tur: "liste" })} />
      )}
    </View>
  );
}
