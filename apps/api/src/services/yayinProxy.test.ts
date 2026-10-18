import { describe, expect, it } from "vitest";
import { imzaGecerli } from "./sinyal.js";
import { coz, m3u8Yeniden, ozelAdresMi } from "./yayinProxy.js";

const GIZLI = "test-anahtar";
const ID = "64b000000000000000000001";
const BITIS = Date.now() + 60_000;

describe("m3u8Yeniden", () => {
  const liste = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"',
    "#EXTINF:6,",
    "seg1.ts",
    "#EXTINF:6,",
    "https://cdn.example.com/a/seg2.ts?token=1",
    "",
  ].join("\n");

  it("göreli ve mutlak adresleri imzalı proxy adresine çevirir", () => {
    const cikti = m3u8Yeniden(liste, "https://kaynak.example.com/live/index.m3u8", ID, BITIS, GIZLI);
    const adresler = [...cikti.matchAll(/u=([A-Za-z0-9_-]+)&sig=([a-f0-9]+)/g)];
    expect(adresler).toHaveLength(3);
    const cozulen = adresler.map((m) => coz(m[1]));
    expect(cozulen).toContain("https://kaynak.example.com/live/seg1.ts");
    expect(cozulen).toContain("https://kaynak.example.com/live/key.bin");
    expect(cozulen).toContain("https://cdn.example.com/a/seg2.ts?token=1");
    for (const m of adresler) expect(imzaGecerli(GIZLI, `${ID}:${m[1]}`, BITIS, m[2])).toBe(true);
    expect(cikti).toContain("#EXTINF:6,");
  });
});

describe("ozelAdresMi", () => {
  it("iç ağ adreslerini engeller, genel adresleri geçirir", () => {
    for (const a of ["http://127.0.0.1/x", "http://localhost/x", "http://10.0.0.5/x", "http://192.168.1.1/x", "http://169.254.169.254/x", "http://[::1]/x", "ftp://example.com/x"]) {
      expect(ozelAdresMi(a)).toBe(true);
    }
    expect(ozelAdresMi("https://cdn.example.com/seg.ts")).toBe(false);
    expect(ozelAdresMi("http://8.8.8.8/seg.ts")).toBe(false);
  });
});
