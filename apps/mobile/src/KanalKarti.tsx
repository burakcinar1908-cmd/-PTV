import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Kanal } from "./api";
import { renk } from "./theme";

type Props = { kanal: Kanal; onSec: (k: Kanal) => void };

// Liste yeniden çizilirken sadece değişen kartlar render edilsin diye memo ile sarıldı.
function KanalKartiBilesen({ kanal, onSec }: Props) {
  return (
    <Pressable onPress={() => onSec(kanal)} style={({ pressed }) => [styles.kart, pressed && styles.basili]}>
      <View style={styles.logoKutu}>
        <Text style={styles.logoHarf}>{kanal.ad.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.kategori} numberOfLines={1}>{kanal.kategori}</Text>
      <Text style={styles.ad} numberOfLines={2}>{kanal.ad}</Text>
    </Pressable>
  );
}

export const KanalKarti = memo(KanalKartiBilesen);

const styles = StyleSheet.create({
  kart: { flex: 1, backgroundColor: renk.yuzey, borderColor: renk.cizgi, borderWidth: 1, borderRadius: 16, padding: 12 },
  basili: { opacity: 0.8 },
  logoKutu: {
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: "rgba(34,211,238,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  logoHarf: { color: "rgba(165,243,252,0.85)", fontSize: 26, fontWeight: "600" },
  kategori: { color: "#67e8f9", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },
  ad: { color: renk.metin, fontSize: 14, marginTop: 4 },
});
