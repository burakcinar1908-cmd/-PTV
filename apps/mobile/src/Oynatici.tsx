import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { istek, yayinUrl, type Kanal } from "./api";

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
    <View style={styles.kapsayici}>
      <Pressable onPress={onGeri} style={styles.geri}>
        <Text style={styles.geriYazi}>← Kanallar</Text>
      </Pressable>
      <Text style={styles.baslik}>{kanal.ad}</Text>

      <View style={styles.videoKutu}>
        {url && <VideoView player={player} style={styles.video} nativeControls allowsFullscreen />}
        {!url && !hata && <ActivityIndicator color="#22d3ee" />}
        {hata && <Text style={styles.hata}>{hata}</Text>}
      </View>

      {kanal.aciklama ? <Text style={styles.aciklama}>{kanal.aciklama}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: "#05060a", paddingTop: 56, paddingHorizontal: 16 },
  geri: { marginBottom: 12 },
  geriYazi: { color: "#67e8f9", fontSize: 15 },
  baslik: { color: "#f1f5f9", fontSize: 22, fontWeight: "600", marginBottom: 16 },
  videoKutu: {
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  video: { width: "100%", height: "100%" },
  hata: { color: "#fecdd3", padding: 16, textAlign: "center" },
  aciklama: { color: "#94a3b8", marginTop: 16, lineHeight: 20 },
});
