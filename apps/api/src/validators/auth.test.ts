import { describe, it, expect } from "vitest";
import { kayitSemasi, girisSemasi, sifreSifirlaSemasi } from "./auth.js";
import { tokenOzeti, rastgeleToken } from "../lib/tokens.js";

describe("kayit semasi", () => {
  it("geçerli veriyi kabul eder ve e-postayı küçük harfe çevirir", () => {
    const sonuc = kayitSemasi.parse({ ad: "Burak", email: "Burak@Test.com", sifre: "Sifre1234" });
    expect(sonuc.email).toBe("burak@test.com");
  });

  it("8 karakterden kısa şifreyi reddeder", () => {
    const sonuc = kayitSemasi.safeParse({ ad: "Burak", email: "a@b.com", sifre: "Sif1" });
    expect(sonuc.success).toBe(false);
  });

  it("rakamsız şifreyi reddeder", () => {
    const sonuc = kayitSemasi.safeParse({ ad: "Burak", email: "a@b.com", sifre: "SifreSifre" });
    expect(sonuc.success).toBe(false);
  });

  it("geçersiz e-postayı reddeder", () => {
    const sonuc = kayitSemasi.safeParse({ ad: "Burak", email: "gecersiz", sifre: "Sifre1234" });
    expect(sonuc.success).toBe(false);
  });
});

describe("giris semasi", () => {
  it("boş şifreyi reddeder", () => {
    expect(girisSemasi.safeParse({ email: "a@b.com", sifre: "" }).success).toBe(false);
  });
});

describe("sifre sifirla semasi", () => {
  it("kısa token'ı reddeder", () => {
    expect(sifreSifirlaSemasi.safeParse({ token: "kisa", yeniSifre: "Sifre1234" }).success).toBe(false);
  });
});

describe("token yardımcıları", () => {
  it("aynı girdi için aynı özeti üretir ve token'ı açık saklamaz", () => {
    const token = rastgeleToken();
    expect(tokenOzeti(token)).toBe(tokenOzeti(token));
    expect(tokenOzeti(token)).not.toContain(token);
    expect(token).toHaveLength(64);
  });
});
