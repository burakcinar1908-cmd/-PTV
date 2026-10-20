import mongoose from "mongoose";
import { app } from "../src/app.js";
import { connectDb } from "../src/db/connect.js";

let baglanti: Promise<void> | null = null;

export default async function handler(req: any, res: any) {
  if (mongoose.connection.readyState !== 1) {
    baglanti ??= connectDb().catch((err) => {
      baglanti = null;
      throw err;
    });
    await baglanti;
  }
  return app(req, res);
}
