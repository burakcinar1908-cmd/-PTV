import { Router } from "express";
import { SupportMessage } from "../db/models/SupportMessage.js";
import { dogrula } from "../lib/dogrula.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { girisLimiti } from "../middleware/rateLimit.js";
import { destekSemasi } from "../validators/yonetim.js";

const router = Router();

router.post(
  "/",
  girisLimiti,
  asyncHandler(async (req, res) => {
    const veri = dogrula(destekSemasi, req.body);
    await SupportMessage.create({ ad: veri.ad, email: veri.email ?? "", mesaj: veri.mesaj });
    res.status(201).json({ mesaj: "Mesajınız alındı. En kısa sürede dönüş yapacağız." });
  })
);

export default router;
