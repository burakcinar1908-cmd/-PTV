import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import { connectDb } from "../db/connect.js";
import { Channel } from "../db/models/Channel.js";
import { m3uAyristir, slugOlustur } from "../services/m3u.js";

const MAKS_LINK_BOYUTU = 30 * 1024 * 1024;
const kaynak = process.argv[2];

if (!kaynak) {
  console.error('Kullanım: pnpm --filter @iptv/api run m3u:iceaktar "<dosya-yolu veya link>"');
  process.exit(1);
}

async function icerigiAl(): Promise<string> {
  if (/^https?:\/\//i.test(kaynak)) {
    const yanit = await fetch(kaynak, { signal: AbortSignal.timeout(15000) });
    if (!yanit.ok) throw new Error(`Liste indirilemedi (HTTP ${yanit.status}).`);
    const metin = await yanit.text();
    if (metin.length > MAKS_LINK_BOYUTU) throw new Error("Liste çok büyük (30 MB sınırı).");
    return metin;
  }
  // Yerel dosya yönetici tarafından kendi bilgisayarından verildiği için boyut sınırı uygulanmaz.
  return readFile(kaynak, "utf8");
}

try {
  const icerik = await icerigiAl();
  const kanallar = m3uAyristir(icerik);
  if (kanallar.length === 0) {
    console.log("Listede http/https yayın adresi bulunamadı.");
    process.exit(0);
  }

  await connectDb();

  // Aynı slug'ı taşıyan kanallara sayı ekler: haber, haber-2, ...
  const kullanilan = new Map<string, number>();
  let eklenen = 0;

  for (const [sira, kanal] of kanallar.entries()) {
    const temel = slugOlustur(kanal.ad);
    const adet = (kullanilan.get(temel) ?? 0) + 1;
    kullanilan.set(temel, adet);
    const slug = adet === 1 ? temel : `${temel}-${adet}`;

    await Channel.updateOne(
      { slug },
      {
        $set: {
          ad: kanal.ad.slice(0, 100),
          kategori: kanal.kategori.slice(0, 60),
          logo: kanal.logo,
          aciklama: "",
          yayinUrl: kanal.yayinUrl,
          aktif: true,
          siralama: 100 + sira,
        },
        $setOnInsert: { slug },
      },
      { upsert: true }
    );
    eklenen++;
  }

  console.log(`${eklenen} kanal içe aktarıldı/güncellendi.`);
} catch (err) {
  console.error("İçe aktarma hatası:", (err as Error).message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
