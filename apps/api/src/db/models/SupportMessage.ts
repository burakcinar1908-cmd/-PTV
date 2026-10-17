import { Schema, model } from "mongoose";

const destekSchema = new Schema(
  {
    ad: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: "" },
    mesaj: { type: String, required: true, trim: true, maxlength: 1000 },
    durum: { type: String, enum: ["yeni", "okundu"], default: "yeni", index: true },
    yanit: { type: String, trim: true, maxlength: 2000, default: "" },
    yanitTarih: { type: Date },
    takipKodu: { type: String, index: true, default: "" },
  },
  { timestamps: true }
);

export const SupportMessage = model("SupportMessage", destekSchema);
