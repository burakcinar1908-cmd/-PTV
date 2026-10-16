import { Schema, model } from "mongoose";

const telefonDogrulamaSchema = new Schema(
  {
    telefon: { type: String, required: true, unique: true, index: true }, // E.164, + olmadan: 905xxxxxxxxx
    kodOzeti: { type: String, required: true },
    denemeSayisi: { type: Number, default: 0 },
    sonGonderim: { type: Date, required: true },
    // Süre dolunca Mongo bu kaydı kendisi siler (TTL).
    sonTarih: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const TelefonDogrulama = model("TelefonDogrulama", telefonDogrulamaSchema);
