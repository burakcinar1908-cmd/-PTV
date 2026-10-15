import * as SecureStore from "expo-secure-store";
import { API_BASE } from "./config";

const TOKEN_KEY = "oturum_token";

export type Kanal = { id: string; ad: string; kategori: string; logo: string; aciklama: string };
export type Kullanici = { id: string; ad: string; email: string; rol: string };
export type Sonuc<T> = { ok: true; veri: T } | { ok: false; mesaj: string };

export const tokenOku = () => SecureStore.getItemAsync(TOKEN_KEY);
export const tokenKaydet = (t: string) => SecureStore.setItemAsync(TOKEN_KEY, t);
export const tokenSil = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export async function istek<T>(
  yol: string,
  govde?: unknown,
  yontem: "GET" | "POST" | "PATCH" | "DELETE" = "GET"
): Promise<Sonuc<T>> {
  try {
    const token = await tokenOku();
    const res = await fetch(`${API_BASE}/api${yol}`, {
      method: yontem,
      headers: {
        "X-Client": "mobile",
        ...(govde !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: govde !== undefined ? JSON.stringify(govde) : undefined,
    });
    const veri = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, mesaj: typeof veri.hata === "string" ? veri.hata : "Bir hata oluştu." };
    }
    return { ok: true, veri: veri as T };
  } catch {
    return { ok: false, mesaj: "Sunucuya ulaşılamadı. Ağ bağlantınızı kontrol edin." };
  }
}

export async function giris(email: string, sifre: string): Promise<Sonuc<{ kullanici: Kullanici }>> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/giris`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client": "mobile" },
      body: JSON.stringify({ email, sifre }),
    });
    const veri = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, mesaj: typeof veri.hata === "string" ? veri.hata : "Giriş başarısız." };
    }
    const token = res.headers.get("x-oturum-token");
    if (!token) return { ok: false, mesaj: "Oturum belirteci alınamadı." };
    await tokenKaydet(token);
    return { ok: true, veri: veri as { kullanici: Kullanici } };
  } catch {
    return { ok: false, mesaj: "Sunucuya ulaşılamadı." };
  }
}

export const yayinUrl = (yol: string) => `${API_BASE}${yol}`;
