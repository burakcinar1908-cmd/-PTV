import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import kanalRoutes from "./routes/kanallar.js";
import paketRoutes from "./routes/paketler.js";
import destekRoutes from "./routes/destek.js";
import hesapRoutes from "./routes/hesap.js";
import yonetimRoutes from "./routes/yonetim.js";
import telefonRoutes from "./routes/telefon.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { HttpHata } from "./lib/hata.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ durum: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/kanallar", kanalRoutes);
app.use("/api/paketler", paketRoutes);
app.use("/api/destek", destekRoutes);
app.use("/api/telefon", telefonRoutes);
app.use("/api/hesap", hesapRoutes);
app.use("/api/yonetim", requireAuth, requireRole("yonetici"), yonetimRoutes);

app.use((_req, res) => {
  res.status(404).json({ hata: "Sayfa bulunamadı." });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpHata) {
    res.status(err.durum).json({ hata: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ hata: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." });
});

