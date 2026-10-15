import { Schema, model, Types } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    ip: String,
    userAgent: String,
    sonErisim: { type: Date, default: Date.now },
    sonaErer: { type: Date, required: true },
    ebeveynAcikTa: { type: Date },
  },
  { timestamps: true }
);

sessionSchema.index({ sonaErer: 1 }, { expireAfterSeconds: 0 });

export const Session = model("Session", sessionSchema);
