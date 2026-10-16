import { z } from "zod";

// Türkiye formatı dahil E.164. Girişte + ya da boşluk olabilir, normalize edilir.
export const telefonSemasi = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, "").replace(/^\+/, "").replace(/^00/, ""))
  .refine((v) => /^[1-9]\d{7,14}$/.test(v), "Geçerli bir telefon numarası girin (ülke koduyla, ör. 905551234567).");

export const kodGonderSemasi = z.object({ telefon: telefonSemasi });

export const kodDogrulaSemasi = z.object({
  telefon: telefonSemasi,
  kod: z.string().regex(/^\d{6}$/, "Kod 6 haneli olmalı."),
});
