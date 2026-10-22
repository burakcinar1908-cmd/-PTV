import { config } from "dotenv";
config({ path: new URL("../../../../.env", import.meta.url) });
import { z } from "zod";

const schema = z.object({
  API_PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().default("localhost"),
  STREAM_SIGNING_SECRET: z.string().min(32),
  STREAM_PUBLIC_URL: z.string().url().default("http://localhost:4100"),
  STREAM_LINK_TTL_SECONDS: z.coerce.number().default(300),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  WHATSAPP_OTP_TEMPLATE: z.string().default("dogrulama_kodu"),
  WHATSAPP_OTP_LANG: z.string().default("tr"),
  WHATSAPP_OTP_BUTTON: z.enum(["true", "false"]).default("false"),
  DEMO_ODEME: z.enum(["true", "false"]).default("true"),
  MAIL_FROM: z.string().default("IPTV Platform <no-reply@ornek.com>"),
});

export const env = schema.parse(process.env);
