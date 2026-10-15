export type M3uKanal = { ad: string; logo: string; kategori: string; yayinUrl: string };

// Tarayıcıda çalışan M3U ayrıştırıcı. Sunucudaki services/m3u.ts ile aynı mantıkta.
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
