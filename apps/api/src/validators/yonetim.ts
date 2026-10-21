import { z } from "zod";

const yayinUrl = z
  .string()
  .trim()
  .max(2000)
  .regex(/^https?:\/\//i, "Yayın adresi http veya https ile başlamalı.");

export const kanalSemasi = z.object({
  ad: z.string().trim().min(1, "Kanal adı gerekli.").max(100),
  kategori: z.string().trim().min(1, "Kategori gerekli.").max(60),
  logo: z.string().trim().max(500).default(""),
  aciklama: z.string().trim().max(500).default(""),
  yayinUrl,
  paketler: z.array(z.string()).default([]),
  aktif: z.boolean().default(true),
});

export const kanalGuncelSemasi = kanalSemasi.partial();

export const m3uSemasi = z.object({
  icerik: z.string().min(1, "Liste boş.").max(8_000_000, "Liste çok büyük."),
  paketler: z.array(z.string()).default([]),
});

export const paketGuncelSemasi = z.object({
  ad: z.string().trim().min(1).max(60).optional(),
  cihazSiniri: z.number().int().min(1).max(20).optional(),
  sureSecenekleri: z
    .array(z.object({ ay: z.number().int().min(1).max(36), fiyat: z.number().min(0).max(100000) }))
    .min(1)
    .max(6)
    .refine((a) => new Set(a.map((s) => s.ay)).size === a.length, "Aynı süre iki kez eklenemez.")
    .optional(),
  ozellikler: z.array(z.string().trim().max(120)).max(20).optional(),
  aktif: z.boolean().optional(),
});

export const destekDurumSemasi = z.object({ durum: z.enum(["yeni", "okundu"]) });

export const destekSemasi = z.object({
  ad: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(80),
  email: z.string().trim().max(120).optional().or(z.literal("")),
  mesaj: z.string().trim().min(5, "Mesaj en az 5 karakter olmalı.").max(1000),
});

export const topluKanalSemasi = z.object({
  kanallar: z
    .array(
      z.object({
        ad: z.string().trim().min(1).max(100),
        kategori: z.string().trim().min(1).max(60),
        logo: z.string().trim().max(500).default(""),
        yayinUrl,
      })
    )
    .min(1)
    .max(500),
  paketler: z.array(z.string()).default([]),
});

export const topluIslemSemasi = z.object({
  islem: z.enum(["paketEkle", "paketCikar", "aktif", "pasif", "sil"]),
  kanalIdleri: z.array(z.string()).max(5000).default([]),
  tumu: z.boolean().default(false),
  paketler: z.array(z.string()).default([]),
});

export const kullaniciGuncelSemasi = z.object({
  ad: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(80).optional(),
  email: z.string().trim().email("Geçersiz e-posta.").max(120).optional(),
  sifre: z.string().min(8, "Şifre en az 8 karakter olmalı.").max(128).optional(),
  dondurulduMu: z.boolean().optional(),
  emailDogrulandi: z.boolean().optional(),
});

export const abonelikEkleSemasi = z.object({
  planId: z.string().min(1, "Paket seçin."),
  ay: z.number().int().min(1).max(36),
});

export const destekYanitSemasi = z.object({
  yanit: z.string().trim().min(2, "Yanıt en az 2 karakter olmalı.").max(2000),
});
