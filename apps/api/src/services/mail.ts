import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transport =
  env.SMTP_HOST && env.SMTP_USER
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

export async function mailGonder(alici: string, konu: string, metin: string): Promise<void> {
  if (!transport) {
    // SMTP yapılandırılmadığında geliştirme için bağlantıyı konsola yazar.
    console.log(`[E-posta - geliştirme] Alıcı: ${alici}\nKonu: ${konu}\n${metin}`);
    return;
  }
  await transport.sendMail({ from: env.MAIL_FROM, to: alici, subject: konu, text: metin });
}
