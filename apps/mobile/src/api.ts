import * as SecureStore from "expo-secure-store";
import { API_BASE } from "./config";

const TOKEN_KEY = "oturum_token";

export type Kanal = { id: string; ad: string; kategori: string; logo: string; aciklama: string };
export type Kullanici = { id: string; ad: string; email: string; rol: string; emailDogrulandi: boolean };
export type Sonuc<T> = { ok: true; veri: T } | { ok: false; mesaj: string };
type Yontem = "GET" | "POST" | "PATCH" | "DELETE";

export const tokenOku = () => SecureStore.getItemAsync(TOKEN_KEY);
export const tokenKaydet = (t: string) => SecureStore.setItemAsync(TOKEN_KEY, t);
export const tokenSil = () => SecureStore.deleteItemAsync(TOKEN_KEY);

// Oturum düşünce (401) uygulama giriş ekranına dönebilsin diye dinleyici.
let oturumDusunce: (() => void) | null = null;
export function oturumDustuDinle(f: () => void) {
  oturumDusunce = f;
}

function hataMesaji(veri: Record<string, unknown>, varsayilan: string) {
  return typeof veri.hata === "string" ? veri.hata : varsayilan;
}

async function ag(yol: string, init: RequestInit): Promise<Sonuc<Record<string, unknown>>> {
  try {
    const res = await fetch(`${API_BASE}${yol}`, init);
    const veri = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 401 && oturumDusunce) {
      await tokenSil();
      oturumDusunce();
    }
    if (!res.ok) return { ok: false, mesaj: hataMesaji(veri, "Bir hata oluştu.") };
    return { ok: true, veri };
  } catch (e) {
    return { ok: false, mesaj: `Sunucuya ulaşılamadı: ${String(e)}` };
  }
}

export async function istek<T>(yol: string, govde?: unknown, yontem: Yontem = "GET"): Promise<Sonuc<T>> {
  const token = await tokenOku();
  const s = await ag(`/api${yol}`, {
    method: yontem,
    headers: {
      "X-Client": "mobile",
      ...(govde !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: govde !== undefined ? JSON.stringify(govde) : undefined,
  });
  return s.ok ? { ok: true, veri: s.veri as T } : s;
}

export async function giris(email: string, sifre: string): Promise<Sonuc<{ kullanici: Kullanici }>> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/giris`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client": "mobile" },
      body: JSON.stringify({ email, sifre }),
    });
    const veri = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, mesaj: hataMesaji(veri, "Giriş başarısız.") };
    const token = res.headers.get("x-oturum-token");
    if (!token) return { ok: false, mesaj: "Oturum belirteci alınamadı." };
    await tokenKaydet(token);
    return { ok: true, veri: veri as { kullanici: Kullanici } };
  } catch (e) {
    return { ok: false, mesaj: `Sunucuya ulaşılamadı: ${String(e)}` };
  }
}

export async function kayitOl(ad: string, email: string, sifre: string): Promise<Sonuc<{ mesaj: string }>> {
  const s = await ag("/api/auth/kayit", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client": "mobile" },
    body: JSON.stringify({ ad, email, sifre }),
  });
  return s.ok ? { ok: true, veri: { mesaj: String(s.veri.mesaj ?? "Kayıt başarılı.") } } : s;
}

export async function sifreSifirlaIste(email: string): Promise<Sonuc<{ mesaj: string }>> {
  const s = await ag("/api/auth/sifre-sifirla-iste", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client": "mobile" },
    body: JSON.stringify({ email }),
  });
  return s.ok ? { ok: true, veri: { mesaj: String(s.veri.mesaj ?? "İstek alındı.") } } : s;
}

export async function dogrulamaTekrarGonder(email: string): Promise<Sonuc<{ mesaj: string }>> {
  const s = await ag("/api/auth/dogrulama-tekrar", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client": "mobile" },
    body: JSON.stringify({ email }),
  });
  return s.ok ? { ok: true, veri: { mesaj: String(s.veri.mesaj ?? "Gönderildi.") } } : s;
}

export async function dogrulaToken(token: string): Promise<Sonuc<{ mesaj: string }>> {
  const s = await ag("/api/auth/dogrula", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client": "mobile" },
    body: JSON.stringify({ token }),
  });
  return s.ok ? { ok: true, veri: { mesaj: String(s.veri.mesaj ?? "Hesabınız doğrulandı.") } } : s;
}

// Sunucuda oturumu kapatır, yerel belirteci siler. Ağ hatası olsa da yerel çıkış yapılır.
export async function cikisYap(): Promise<void> {
  const token = await tokenOku();
  if (token) {
    await ag("/api/auth/cikis", {
      method: "POST",
      headers: { "X-Client": "mobile", Authorization: `Bearer ${token}` },
    });
  }
  await tokenSil();
}

export const yayinUrl = (yol: string) => `${API_BASE}${yol}`;
