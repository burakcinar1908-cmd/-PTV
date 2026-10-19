import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    ad: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sifreHash: { type: String, required: true, select: false },
    rol: { type: String, enum: ["kullanici", "yonetici"], default: "kullanici" },
    emailDogrulandi: { type: Boolean, default: false },
    dogrulamaTokenHash: { type: String, select: false },
    dogrulamaSonTarih: { type: Date, select: false },
    sifreSifirlaTokenHash: { type: String, select: false },
    sifreSifirlaSonTarih: { type: Date, select: false },
    basarisizGiris: { type: Number, default: 0, select: false },
    kilitliYonelimi: { type: Date, select: false },
    ebeveynPinHash: { type: String, select: false },
    ebeveynKategoriler: { type: [String], default: [] },
    ebeveynTumKanallar: { type: Boolean, default: false },
    dondurulduMu: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ dogrulamaTokenHash: 1 }, { sparse: true });
userSchema.index({ sifreSifirlaTokenHash: 1 }, { sparse: true });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: unknown };
export const User = model("User", userSchema);
