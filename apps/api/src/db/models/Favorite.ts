import { Schema, model, Types } from "mongoose";

const favoriteSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    channelId: { type: Types.ObjectId, ref: "Channel", required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ userId: 1, channelId: 1 }, { unique: true });

export const Favorite = model("Favorite", favoriteSchema);
