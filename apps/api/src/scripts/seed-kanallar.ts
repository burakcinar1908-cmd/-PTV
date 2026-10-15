import mongoose from "mongoose";
import { connectDb } from "../db/connect.js";
import { Channel } from "../db/models/Channel.js";

// Yalnızca geliştirme için örnek yayın. Gerçek kullanımda kendi izinli kaynaklarınızı kullanın.
const ORNEK_YAYIN = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

const kanallar = [
  { ad: "Örnek Haber 1", slug: "ornek-haber-1", kategori: "Haber", aciklama: "Örnek haber kanalı." },
  { ad: "Örnek Haber 2", slug: "ornek-haber-2", kategori: "Haber", aciklama: "Örnek haber kanalı." },
  { ad: "Örnek Spor 1", slug: "ornek-spor-1", kategori: "Spor", aciklama: "Örnek spor kanalı." },
  { ad: "Örnek Belgesel", slug: "ornek-belgesel", kategori: "Belgesel", aciklama: "Örnek belgesel kanalı." },
  { ad: "Örnek Müzik", slug: "ornek-muzik", kategori: "Müzik", aciklama: "Örnek müzik kanalı." },
  { ad: "Örnek Çocuk", slug: "ornek-cocuk", kategori: "Çocuk", aciklama: "Örnek çocuk kanalı." },
];

await connectDb();
for (const [sira, kanal] of kanallar.entries()) {
  await Channel.updateOne(
    { slug: kanal.slug },
    { $set: { ...kanal, yayinUrl: ORNEK_YAYIN, siralama: sira, aktif: true } },
    { upsert: true }
  );
}
console.log(`${kanallar.length} örnek kanal hazır.`);
await mongoose.disconnect();
