import { env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { app } from "./app.js";

connectDb()
  .then(() => {
    app.listen(env.API_PORT, () => {
      console.log(`API çalışıyor: http://localhost:${env.API_PORT}`);
    });
  })
  .catch((err) => {
    console.error("Veritabanına bağlanılamadı:", (err as Error).message);
    process.exit(1);
  });
