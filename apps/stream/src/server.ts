import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import { env } from "./env.js";
import { HttpHata } from "./lib/hata.js";
import yayinRoutes from "./routes/yayin.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
// Video kaynağı başka origin'den yüklenir; helmet'in varsayılan same-origin politikası bunu engeller.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.WEB_ORIGIN, methods: ["GET", "HEAD"] }));

app.get("/health", (_req, res) => {
  res.json({ durum: "ok", db: mongoose.connection.readyState === 1 });
});
app.use("/yayin", yayinRoutes);

app.use((_req, res) => {
  res.status(404).json({ hata: "Sayfa bulunamadı." });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpHata) {
    res.status(err.durum).json({ hata: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ hata: "Beklenmeyen bir hata oluştu." });
});

mongoose.set("strictQuery", true);
mongoose
  .connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    app.listen(env.STREAM_PORT, () => console.log(`Yayın sunucusu: http://localhost:${env.STREAM_PORT}`));
  })
  .catch((err) => {
    console.error("Veritabanına bağlanılamadı:", (err as Error).message);
    process.exit(1);
  });
