import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { istek, yayinUrl, type Kanal } from "./api";
import { bosluk, renk } from "./theme";

type YayinYaniti = { url: string; tur?: string; oynatmaId: string; kalpSaniye: number };

export default function Oynatici({ kanal, onGeri }: { kanal: Kanal; onGeri: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const oynatmaRef = useRef<string | null>(null);

  useEffect(() => {
    let iptal = false;
    let kalp: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const s = await istek<YayinYaniti>(`/kanallar/${kanal.id}/yayin`);
      if (iptal) return;
      if (!s.ok) return setHata(s.mesaj);
      oynatmaRef.current = s.veri.oynatmaId;
      setUrl(yayinUrl(s.veri.url));
      // Cihaz sınırı için kalp atışı; web oynatıcısıyla aynı mantık.
      kalp = setInterval(() => {
        if (oynatmaRef.current) istek("/kanallar/yayin/kalp", { oynatmaId: oynatmaRef.current }, "POST");
      }, s.veri.kalpSaniye * 1000);
    })();

    return () => {
      iptal = true;
      if (kalp) clearInterval(kalp);
      if (oynatmaRef.current) istek(`/kanallar/yayin/${oynatmaRef.current}`, undefined, "DELETE");
      oynatmaRef.current = null;
    };
  }, [kanal.id]);

  const player = useVideoPlayer(url ?? "", (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (url) player.play();
  }, [url, player]);


  return (
    <ScrollView style={styles.kapsayici} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={onGeri} style={styles.geriButon}>
        <Text style={styles.geriYazi}>← Kanallar</Text>
      </Pressable>

      <View style={styles.videoKutu}>
        {url && <VideoView player={player} style={styles.video} nativeControls allowsFullscreen />}
        {!url && !hata && <ActivityIndicator color={renk.vurgu} />}
        {hata && (
          <View style={styles.hataIcerik}>
            <Text style={styles.hataBaslik}>Yayın açılamadı</Text>
            <Text style={styles.hataYazi}>{hata}</Text>
          </View>
        )}
      </View>

      <View style={styles.bilgiKart}>
        <View style={styles.bilgiUst}>
          <View style={styles.logoKutu}>
            <Text style={styles.logoHarf}>{kanal.ad.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kategori}>{kanal.kategori}</Text>
            <Text style={styles.baslik}>{kanal.ad}</Text>
          </View>
        </View>
        {kanal.aciklama ? <Text style={styles.aciklama}>{kanal.aciklama}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: renk.zemin, paddingTop: 56, paddingHorizontal: bosluk.orta },
  geriButon: { alignSelf: "flex-start", marginBottom: bosluk.orta },
  geriYazi: { color: renk.vurgu, fontSize: 15 },
  videoKutu: {
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderColor: renk.cizgi,
    borderWidth: 1,
  },
  video: { width: "100%", height: "100%" },
  hataIcerik: { padding: bosluk.orta, alignItems: "center", gap: 6 },
  hataBaslik: { color: renk.metin, fontWeight: "600", fontSize: 15 },
  hataYazi: { color: renk.hata, textAlign: "center", fontSize: 13, lineHeight: 18 },
  bilgiKart: {
    marginTop: bosluk.orta,
    backgroundColor: renk.yuzey,
    borderColor: renk.cizgi,
    borderWidth: 1,
    borderRadius: 18,
    padding: bosluk.orta,
  },
  bilgiUst: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoKutu: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(34,211,238,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoHarf: { color: "rgba(165,243,252,0.9)", fontSize: 20, fontWeight: "600" },
  kategori: { color: "#67e8f9", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },
  baslik: { color: renk.metin, fontSize: 20, fontWeight: "600", marginTop: 2 },
  aciklama: { color: renk.metinSoluk, marginTop: bosluk.orta, lineHeight: 20 },
});
