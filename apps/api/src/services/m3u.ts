export type M3uKanal = {
  ad: string;
  logo: string;
  kategori: string;
  yayinUrl: string;
};

// #EXTINF satırlarındaki tvg-logo ve group-title değerleri ile kanal adını okur.
// Yalnızca http/https adresi olan yayınlar alınır.
export function m3uAyristir(icerik: string): M3uKanal[] {
  const sonuc: M3uKanal[] = [];
  let bekleyen: Omit<M3uKanal, "yayinUrl"> | null = null;

  for (const ham of icerik.split(/\r?\n/)) {
    const satir = ham.trim();
    if (!satir) continue;

    if (satir.startsWith("#EXTINF")) {
      const logo = /tvg-logo="([^"]*)"/i.exec(satir)?.[1] ?? "";
      const grup = /group-title="([^"]*)"/i.exec(satir)?.[1] ?? "";
      const ad = satir.slice(satir.lastIndexOf(",") + 1).trim() || "İsimsiz Kanal";
      bekleyen = { ad, logo: logo.trim(), kategori: grup.trim() || "Genel" };
    } else if (!satir.startsWith("#")) {
      if (/^https?:\/\//i.test(satir)) {
        sonuc.push({
          ad: bekleyen?.ad ?? "İsimsiz Kanal",
          logo: bekleyen?.logo ?? "",
          kategori: bekleyen?.kategori ?? "Genel",
          yayinUrl: satir,
        });
      }
      bekleyen = null;
    }
  }
  return sonuc;
}

const TURKCE_HARITA: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };

export function slugOlustur(metin: string): string {
  const temiz = metin
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (h) => TURKCE_HARITA[h] ?? h)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return temiz || "kanal";
}

// Yayın adresinin türünü tahmin eder: doğrudan dosya (MP4/MKV vb.) ya da HLS (m3u8).
export function yayinTuru(url: string): "hls" | "dogrudan" {
  const yol = url.split("?")[0].toLowerCase();
  return /\.(mp4|mkv|webm|avi|mov)$/.test(yol) ? "dogrudan" : "hls";
}
