import { Schema, model, Types } from "mongoose";

const subscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: Types.ObjectId, ref: "Plan", required: true },
    ay: { type: Number, required: true },
    cihazSiniri: { type: Number, required: true },
    durum: { type: String, enum: ["aktif", "sona_erdi"], default: "aktif" },
    baslangic: { type: Date, required: true, default: Date.now },
    bitis: { type: Date, required: true, index: true },
    saglayici: { type: String, enum: ["demo"], default: "demo" },
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", subscriptionSchema);
