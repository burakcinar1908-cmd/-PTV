import mongoose from "mongoose";
import { connectDb } from "../db/connect.js";
import { Plan } from "../db/models/Plan.js";
import { Channel } from "../db/models/Channel.js";

// Tüm süreler (1, 3, 12 ay) ücretsiz demo. Gerçek fiyatları yönetim panelinden girin.
const paketler = [
  { ad: "Temel", slug: "temel", cihazSiniri: 2, ozellikler: ["Seçili kanal listesi", "HD izleme", "2 cihaz"] },
  { ad: "Standart", slug: "standart", cihazSiniri: 3, ozellikler: ["Geniş kanal listesi", "Favoriler", "3 cihaz"] },
  { ad: "Premium", slug: "premium", cihazSiniri: 4, ozellikler: ["Tüm kanallar", "Son izlenenler", "4 cihaz"] },
];

const sureSecenekleri = [
  { ay: 1, fiyat: 0 },
  { ay: 3, fiyat: 0 },
  { ay: 12, fiyat: 0 },
];

await connectDb();
for (const [sira, paket] of paketler.entries()) {
  await Plan.updateOne(
    { slug: paket.slug },
    { $set: { ...paket, sureSecenekleri, siralama: sira, aktif: true } },
    { upsert: true }
  );
}

// Paketi olmayan kanallar demo için tüm paketlere eklenir. Yönetim panelinden listeleri ayırabilirsiniz.
const planIdleri = (await Plan.find({ aktif: true }).select("_id").lean()).map((p) => p._id);
const guncellenen = await Channel.updateMany({ paketler: { $size: 0 } }, { $set: { paketler: planIdleri } });

console.log(`${paketler.length} demo paket hazır. ${guncellenen.modifiedCount} kanal paketlere eklendi.`);
await mongoose.disconnect();
