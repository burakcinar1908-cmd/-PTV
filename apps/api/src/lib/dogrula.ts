import type { ZodTypeAny, z } from "zod";
import { HttpHata } from "./hata.js";

export function dogrula<S extends ZodTypeAny>(semasi: S, veri: unknown): z.infer<S> {
  const sonuc = semasi.safeParse(veri);
  if (!sonuc.success) throw new HttpHata(400, sonuc.error.issues[0]?.message ?? "Geçersiz veri.");
  return sonuc.data as z.infer<S>;
}
