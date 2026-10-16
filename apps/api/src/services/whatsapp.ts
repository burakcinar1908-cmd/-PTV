import { env } from "../config/env.js";

const GRAPH = "https://graph.facebook.com/v21.0";

// Doğrulama kodunu WhatsApp Cloud API üzerinden gönderir.
// Yapılandırma yoksa kodu konsola yazar (geliştirme).
export async function otpGonder(telefon: string, kod: string): Promise<void> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID) {
    console.log(`[WhatsApp - geliştirme] Alıcı: +${telefon} Kod: ${kod}`);
    return;
  }

  const bilesenler: unknown[] = [{ type: "body", parameters: [{ type: "text", text: kod }] }];
  if (env.WHATSAPP_OTP_BUTTON === "true") {
    // Meta "kodu kopyala" butonlu kimlik doğrulama şablonları için.
    bilesenler.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: kod }],
    });
  }

  const res = await fetch(`${GRAPH}/${env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: telefon,
      type: "template",
      template: {
        name: env.WHATSAPP_OTP_TEMPLATE,
        language: { code: env.WHATSAPP_OTP_LANG },
        components: bilesenler,
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const detay = await res.text().catch(() => "");
    throw new Error(`WhatsApp ${res.status}: ${detay}`);
  }
}
