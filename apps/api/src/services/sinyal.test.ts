import { describe, it, expect } from "vitest";
import { imzala, imzaGecerli } from "./sinyal.js";

const ANAHTAR = "test-anahtari-en-az-32-karakter-olsun";
const KANAL = "6acf7465cba467db42a93a99";

describe("yayın imzası", () => {
  it("doğru imza ve süre içinde geçerli", () => {
    const bitis = Date.now() + 60_000;
    expect(imzaGecerli(ANAHTAR, KANAL, bitis, imzala(ANAHTAR, KANAL, bitis))).toBe(true);
  });

  it("süresi dolmuş bağlantıyı reddeder", () => {
    const bitis = Date.now() - 1000;
    expect(imzaGecerli(ANAHTAR, KANAL, bitis, imzala(ANAHTAR, KANAL, bitis))).toBe(false);
  });

  it("farklı kanal için imzayı reddeder", () => {
    const bitis = Date.now() + 60_000;
    const sig = imzala(ANAHTAR, KANAL, bitis);
    expect(imzaGecerli(ANAHTAR, "baska-kanal", bitis, sig)).toBe(false);
  });

  it("değiştirilmiş imzayı reddeder", () => {
    const bitis = Date.now() + 60_000;
    expect(imzaGecerli(ANAHTAR, KANAL, bitis, "0".repeat(64))).toBe(false);
  });
});
