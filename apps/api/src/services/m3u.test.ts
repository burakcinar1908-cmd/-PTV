import { describe, it, expect } from "vitest";
import { m3uAyristir, slugOlustur } from "./m3u.js";

const ORNEK = `#EXTM3U
#EXTINF:-1 tvg-logo="https://img.ornek.com/a.png" group-title="Haber",Örnek Haber
https://yayin.ornek.com/haber/index.m3u8
#EXTINF:-1 group-title="Spor",Örnek Spor
https://yayin.ornek.com/spor/index.m3u8
#EXTINF:-1,Logosuz Kanal
rtmp://sunucu.ornek.com/canli
#EXTINF:-1 group-title="Belgesel",Örnek Belgesel
https://yayin.ornek.com/belgesel.m3u8
`;

describe("m3uAyristir", () => {
  it("kanal adı, logo, grup ve yayın adresini okur", () => {
    const kanallar = m3uAyristir(ORNEK);
    expect(kanallar[0]).toEqual({
      ad: "Örnek Haber",
      logo: "https://img.ornek.com/a.png",
      kategori: "Haber",
      yayinUrl: "https://yayin.ornek.com/haber/index.m3u8",
    });
  });

  it("grup yoksa Genel kategorisini kullanır, logo yoksa boş bırakır", () => {
    const kanal = m3uAyristir(`#EXTINF:-1,Sade\nhttps://a.com/x.m3u8`)[0];
    expect(kanal.kategori).toBe("Genel");
    expect(kanal.logo).toBe("");
  });

  it("http/https olmayan adresleri atlar", () => {
    const kanallar = m3uAyristir(ORNEK);
    expect(kanallar.some((k) => k.yayinUrl.startsWith("rtmp"))).toBe(false);
    expect(kanallar).toHaveLength(3);
  });

  it("boş ya da bozuk içerikte boş liste döner", () => {
    expect(m3uAyristir("")).toEqual([]);
    expect(m3uAyristir("merhaba dünya")).toEqual([]);
  });
});

describe("slugOlustur", () => {
  it("Türkçe karakterleri sadeleştirir", () => {
    expect(slugOlustur("Çocuk Kuşağı İzle")).toBe("cocuk-kusagi-izle");
  });

  it("boş metin için varsayılan değer verir", () => {
    expect(slugOlustur("!!!")).toBe("kanal");
  });
});
