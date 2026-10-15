import mongoose from "mongoose";
import { connectDb } from "../db/connect.js";
import { User } from "../db/models/User.js";
import { hashle } from "../lib/sifre.js";

const [, , email, sifre, ad] = process.argv;

if (!email || !sifre) {
  console.error('Kullanım: pnpm --filter @iptv/api run yonetici:olustur "e-posta" "şifre" "Ad Soyad"');
  process.exit(1);
}
if (sifre.length < 8 || !/[A-Za-z]/.test(sifre) || !/[0-9]/.test(sifre)) {
  console.error("Şifre en az 8 karakter olmalı ve harf ile rakam içermeli.");
  process.exit(1);
}

try {
  await connectDb();
  const normalEmail = email.trim().toLowerCase();
  const sifreHash = await hashle(sifre);

  await User.updateOne(
    { email: normalEmail },
    {
      $set: { rol: "yonetici", emailDogrulandi: true, sifreHash, ad: ad ?? "Yönetici", basarisizGiris: 0 },
      $unset: { kilitliYonelimi: "", dogrulamaTokenHash: "", dogrulamaSonTarih: "" },
    },
    { upsert: true }
  );
  console.log(`Yönetici hesabı hazır: ${normalEmail}`);
} catch (err) {
  console.error("Hata:", (err as Error).message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
