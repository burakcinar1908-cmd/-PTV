import { Schema, model } from "mongoose";

const sureSchema = new Schema(
  {
    ay: { type: Number, required: true, min: 1, max: 36 },
    fiyat: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const planSchema = new Schema(
  {
    ad: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    cihazSiniri: { type: Number, required: true, min: 1, default: 1 },
    sureSecenekleri: {
      type: [sureSchema],
      default: () => [
        { ay: 1, fiyat: 0 },
        { ay: 3, fiyat: 0 },
        { ay: 12, fiyat: 0 },
      ],
    },
    ozellikler: { type: [String], default: [] },
    aktif: { type: Boolean, default: true, index: true },
    siralama: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Plan = model("Plan", planSchema);
