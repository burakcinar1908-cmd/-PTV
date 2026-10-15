export type ApiSonuc<T> = { ok: true; veri: T } | { ok: false; mesaj: string };

export async function api<T>(
  yol: string,
  govde?: unknown,
  yontem: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "POST"
): Promise<ApiSonuc<T>> {
  try {
    const res = await fetch(`/api${yol}`, {
      method: yontem,
      headers: govde !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: govde !== undefined ? JSON.stringify(govde) : undefined,
      credentials: "include",
    });
    const veri = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const mesaj = typeof veri.hata === "string" ? veri.hata : "Bir hata oluştu. Lütfen tekrar deneyin.";
      return { ok: false, mesaj };
    }
    return { ok: true, veri: veri as T };
  } catch {
    return { ok: false, mesaj: "Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edin." };
  }
}
