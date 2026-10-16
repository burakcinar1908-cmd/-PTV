import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Render ücretsiz planda giden SMTP portları (587/465) kapalı olabilir. Bu yüzden
// öncelik HTTPS tabanlı Resend API'sinde; yoksa SMTP'ye düşer; o da yoksa konsola yazar.
const smtpTransport =
  env.SMTP_HOST && env.SMTP_USER
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      })
    : null;

async function resendIle(alici: string, konu: string, metin: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [alici], subject: konu, text: metin }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const detay = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detay}`);
  }
}

export async function mailGonder(alici: string, konu: string, metin: string): Promise<void> {
  if (env.RESEND_API_KEY) return resendIle(alici, konu, metin);
  if (smtpTransport) {
    await smtpTransport.sendMail({ from: env.MAIL_FROM, to: alici, subject: konu, text: metin });
    return;
  }
  // Yapılandırma yoksa geliştirme için bağlantıyı konsola yazar.
  console.log(`[E-posta - geliştirme] Alıcı: ${alici}\nKonu: ${konu}\n${metin}`);
}
