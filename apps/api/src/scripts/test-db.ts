import { config } from "dotenv";
config({ path: new URL("../../../../.env", import.meta.url) });
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI tanımlı değil. .env dosyasını kontrol edin.");
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const ping = await mongoose.connection.db?.admin().ping();
  console.log("Bağlantı başarılı:", ping);
} catch (err) {
  console.error("Bağlantı hatası:", (err as Error).message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
