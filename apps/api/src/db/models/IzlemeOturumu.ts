import { Schema, model, Types } from "mongoose";

// Her yayın başlatıldığında bir kayıt oluşur; istemci düzenli olarak kalp atışı gönderir.
// Süresi dolan kayıtlar veritabanı tarafından otomatik silinir.
const izlemeSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    kanalId: { type: Types.ObjectId, ref: "Channel", required: true },
    oynatmaId: { type: String, required: true, unique: true },
    sonKalp: { type: Date, required: true },
  },
  { timestamps: true }
);

izlemeSchema.index({ sonKalp: 1 }, { expireAfterSeconds: 3600 });

export const IzlemeOturumu = model("IzlemeOturumu", izlemeSchema);
