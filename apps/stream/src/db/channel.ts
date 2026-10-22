import mongoose from "mongoose";

// Yalnızca yayın adresi ve aktiflik bilgisi okunur. Şema API'deki ile aynı koleksiyona bakar.
const channelSchema = new mongoose.Schema(
  { yayinUrl: { type: String, select: false }, aktif: { type: Boolean, default: true } },
  { collection: "channels" }
);

export const Channel = mongoose.model("StreamChannel", channelSchema);
