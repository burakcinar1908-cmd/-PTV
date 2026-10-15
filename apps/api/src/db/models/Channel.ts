import { Schema, model, Types } from "mongoose";

const channelSchema = new Schema(
  {
    ad: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    kategori: { type: String, required: true, trim: true, index: true },
    logo: { type: String, default: "" },
    aciklama: { type: String, default: "", maxlength: 500 },
    yayinUrl: { type: String, required: true, select: false },
    aktif: { type: Boolean, default: true, index: true },
    siralama: { type: Number, default: 0 },
    paketler: { type: [Types.ObjectId], ref: "Plan", default: [], index: true },
  },
  { timestamps: true }
);

export const Channel = model("Channel", channelSchema);
