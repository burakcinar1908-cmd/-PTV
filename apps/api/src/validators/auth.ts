import { z } from "zod";

const sifreKurali = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalıdır.")
  .max(128, "Şifre çok uzun.")
  .regex(/[A-Za-z]/, "Şifre en az bir harf içermelidir.")
  .regex(/[0-9]/, "Şifre en az bir rakam içermelidir.");

export const kayitSemasi = z.object({
  ad: z.string().trim().min(2, "Ad en az 2 karakter olmalıdır.").max(80),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi girin."),
  sifre: sifreKurali,
});

export const girisSemasi = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi girin."),
  sifre: z.string().min(1, "Şifre gerekli."),
});

export const tokenSemasi = z.object({ token: z.string().min(32).max(128) });

export const epostaSemasi = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi girin."),
});

export const sifreSifirlaSemasi = z.object({
  token: z.string().min(32).max(128),
  yeniSifre: sifreKurali,
});
