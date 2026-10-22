import { Schema, model } from "mongoose";

// Sunucusuz ortamda bellek sayacı işe yaramaz; sayaçlar veritabanında tutulur.
const rateLimitSchema = new Schema({
  anahtar: { type: String, required: true, unique: true },
  sayac: { type: Number, default: 0 },
  sifirlanma: { type: Date, required: true, index: { expires: 0 } },
});

export const RateLimit = model("RateLimit", rateLimitSchema);
