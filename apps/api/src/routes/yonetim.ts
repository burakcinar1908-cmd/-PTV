import { Router, type Request } from "express";
import { Types } from "mongoose";
import { Channel } from "../db/models/Channel.js";
import { Plan } from "../db/models/Plan.js";
import { Subscription } from "../db/models/Subscription.js";
import { SupportMessage } from "../db/models/SupportMessage.js";
import { User } from "../db/models/User.js";
import { Session } from "../db/models/Session.js";
import { Favorite } from "../db/models/Favorite.js";
import { IzlemeOturumu } from "../db/models/IzlemeOturumu.js";
import { hashle } from "../lib/sifre.js";
import { mailGonder } from "../services/mail.js";
import { HttpHata } from "../lib/hata.js";
import { dogrula } from "../lib/dogrula.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { m3uAyristir, slugOlustur } from "../services/m3u.js";
import { rastgeleToken } from "../lib/tokens.js";
import { benzersizKanalSlug } from "../services/kanalSlug.js";
import {
  abonelikEkleSemasi,
  destekDurumSemasi,
  destekYanitSemasi,
  kullaniciGuncelSemasi,
  kanalGuncelSemasi,
  kanalSemasi,
  m3uSemasi,
  paketGuncelSemasi,
  topluKanalSemasi,
  topluIslemSemasi,
} from "../validators/yonetim.js";

const router = Router();

function objectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw new HttpHata(400, "Geçersiz kimlik.");
  return new Types.ObjectId(id);
}

function kullaniciId(req: Request): Types.ObjectId {
  return (req as Request & { kullanici: { _id: Types.ObjectId } }).kullanici._id;
}

function paketIdleri(idler: string[]): Types.ObjectId[] {
  return [...new Set(idler)].map(objectId);
}

router.get(
  "/ozet",
  asyncHandler(async (_req, res) => {
    const [kullanici, kanal, aktifAbone, yeniDestek] = await Promise.all([
      User.countDocuments(),
      Channel.countDocuments({ aktif: true }),
      Subscription.countDocuments({ durum: "aktif", bitis: { $gt: new Date() } }),
      SupportMessage.countDocuments({ durum: "yeni" }),
    ]);
    res.json({ kullanici, kanal, aktifAbone, yeniDestek });
  })
);

router.get(
  "/kanallar",
  asyncHandler(async (_req, res) => {
    const kanallar = await Channel.find({})
      .select("+yayinUrl")
      .sort({ siralama: 1, ad: 1 })
      .limit(2000)
      .lean();
    res.json({
      kanallar: kanallar.map((k) => ({
        id: String(k._id),
        ad: k.ad,
        slug: k.slug,
        kategori: k.kategori,
        logo: k.logo,
        aciklama: k.aciklama,
        yayinUrl: k.yayinUrl,
        aktif: k.aktif,
        paketler: (k.paketler ?? []).map(String),
      })),
    });
  })
);

router.post(
  "/kanallar",
  asyncHandler(async (req, res) => {
    const veri = dogrula(kanalSemasi, req.body);
    const kanal = await Channel.create({
      ...veri,
      paketler: paketIdleri(veri.paketler),
      slug: await benzersizKanalSlug(veri.ad),
    });
    res.status(201).json({ mesaj: "Kanal eklendi.", id: String(kanal._id) });
  })
);

router.patch(
  "/kanallar/:id",
  asyncHandler(async (req, res) => {
    const id = objectId(req.params.id);
    const veri = dogrula(kanalGuncelSemasi, req.body);
    const guncelleme: Record<string, unknown> = { ...veri };
    if (veri.paketler) guncelleme.paketler = paketIdleri(veri.paketler);
    const sonuc = await Channel.updateOne({ _id: id }, { $set: guncelleme });
    if (sonuc.matchedCount === 0) throw new HttpHata(404, "Kanal bulunamadı.");
    res.json({ mesaj: "Kanal güncellendi." });
  })
);

router.delete(
  "/kanallar/:id",
  asyncHandler(async (req, res) => {
    const sonuc = await Channel.deleteOne({ _id: objectId(req.params.id) });
    if (sonuc.deletedCount === 0) throw new HttpHata(404, "Kanal bulunamadı.");
    res.json({ mesaj: "Kanal silindi." });
  })
);

router.delete(
  "/kategoriler/:ad",
  asyncHandler(async (req, res) => {
    const ad = String(req.params.ad ?? "").trim();
    if (!ad || ad.length > 60) throw new HttpHata(400, "Geçersiz kategori.");
    const sonuc = await Channel.deleteMany({ kategori: ad });
    if (sonuc.deletedCount === 0) throw new HttpHata(404, "Bu kategoride kanal yok.");
    res.json({ mesaj: `"${ad}" kategorisindeki ${sonuc.deletedCount} kanal silindi.`, silinen: sonuc.deletedCount });
  })
);

// Listedeki her yayın adresi için: varsa güncelle, yoksa ekle.
router.post(
  "/m3u-iceaktar",
  asyncHandler(async (req, res) => {
    const veri = dogrula(m3uSemasi, req.body);
    const kanallar = m3uAyristir(veri.icerik).slice(0, 2000);
    if (kanallar.length === 0) throw new HttpHata(400, "Listede http/https yayın adresi bulunamadı.");

    const secilenPaketler = paketIdleri(veri.paketler);
    let eklenen = 0;
    let guncellenen = 0;

    for (const kanal of kanallar) {
      const mevcut = await Channel.findOne({ yayinUrl: kanal.yayinUrl }).select("_id paketler").lean();
      if (mevcut) {
        const birlesik = [...new Set([...(mevcut.paketler ?? []).map(String), ...secilenPaketler.map(String)])];
        await Channel.updateOne(
          { _id: mevcut._id },
          {
            $set: {
              ad: kanal.ad.slice(0, 100),
              kategori: kanal.kategori.slice(0, 60),
              logo: kanal.logo,
              paketler: birlesik.map((p) => new Types.ObjectId(p)),
              aktif: true,
            },
          }
        );
        guncellenen++;
      } else {
        await Channel.create({
          ad: kanal.ad.slice(0, 100),
          slug: await benzersizKanalSlug(kanal.ad),
          kategori: kanal.kategori.slice(0, 60),
          logo: kanal.logo,
          aciklama: "",
          yayinUrl: kanal.yayinUrl,
          paketler: secilenPaketler,
          aktif: true,
        });
        eklenen++;
      }
    }

    res.json({ mesaj: `${eklenen} yeni kanal eklendi, ${guncellenen} kanal güncellendi.`, eklenen, guncellenen });
  })
);


// Seçili kanallar (veya tümü) üzerinde toplu işlem.
router.post(
  "/kanallar/toplu",
  asyncHandler(async (req, res) => {
    const veri = dogrula(topluIslemSemasi, req.body);
    if (!veri.tumu && veri.kanalIdleri.length === 0) {
      throw new HttpHata(400, "Önce en az bir kanal seçin.");
    }
    const paketIdleriListe = paketIdleri(veri.paketler);
    if ((veri.islem === "paketEkle" || veri.islem === "paketCikar") && paketIdleriListe.length === 0) {
      throw new HttpHata(400, "En az bir paket seçin.");
    }

    const filtre = veri.tumu ? {} : { _id: { $in: veri.kanalIdleri.map(objectId) } };

    if (veri.islem === "sil") {
      const sonuc = await Channel.deleteMany(filtre);
      res.json({ mesaj: `${sonuc.deletedCount} kanal silindi.`, etkilenen: sonuc.deletedCount });
      return;
    }

    let sonuc;
    if (veri.islem === "paketEkle") {
      sonuc = await Channel.updateMany(filtre, { $addToSet: { paketler: { $each: paketIdleriListe } } });
      res.json({ mesaj: `${sonuc.modifiedCount} kanal seçilen paketlere eklendi.`, etkilenen: sonuc.modifiedCount });
      return;
    }
    if (veri.islem === "paketCikar") {
      sonuc = await Channel.updateMany(filtre, { $pull: { paketler: { $in: paketIdleriListe } } });
      res.json({ mesaj: `${sonuc.modifiedCount} kanaldan paket kaldırıldı.`, etkilenen: sonuc.modifiedCount });
      return;
    }

    const aktif = veri.islem === "aktif";
    sonuc = await Channel.updateMany(filtre, { $set: { aktif } });
    res.json({
      mesaj: `${sonuc.modifiedCount} kanal ${aktif ? "aktifleştirildi" : "pasifleştirildi"}.`,
      etkilenen: sonuc.modifiedCount,
    });
  })
);

// Tarayıcıda ayrıştırılmış kanalları toplu ekler/günceller (yayın adresine göre).
router.post(
  "/kanal-toplu",
  asyncHandler(async (req, res) => {
    const veri = dogrula(topluKanalSemasi, req.body);
    const secilenPaketler = paketIdleri(veri.paketler);

    const islemler = veri.kanallar.map((k) => ({
      updateOne: {
        filter: { yayinUrl: k.yayinUrl },
        update: {
          $set: { ad: k.ad.slice(0, 100), kategori: k.kategori.slice(0, 60), logo: k.logo, aktif: true },
          $addToSet: { paketler: { $each: secilenPaketler } },
          $setOnInsert: { slug: `${slugOlustur(k.ad)}-${rastgeleToken(4)}`, aciklama: "" },
        },
        upsert: true,
      },
    }));

    // Mongoose'un bulkWrite tipleri dizi alanlarını katı biçimde kontrol ediyor; işlem alanları şemaya göre çevrilir.
    const sonuc = await Channel.bulkWrite(islemler as never, { ordered: false });
    res.json({ eklenen: sonuc.upsertedCount, guncellenen: sonuc.modifiedCount });
  })
);

router.get(
  "/paketler",
  asyncHandler(async (_req, res) => {
    const paketler = await Plan.find({}).sort({ siralama: 1 }).lean();
    res.json({
      paketler: paketler.map((p) => ({
        id: String(p._id),
        ad: p.ad,
        slug: p.slug,
        cihazSiniri: p.cihazSiniri,
        sureSecenekleri: p.sureSecenekleri,
        ozellikler: p.ozellikler,
        aktif: p.aktif,
      })),
    });
  })
);

router.patch(
  "/paketler/:id",
  asyncHandler(async (req, res) => {
    const id = objectId(req.params.id);
    const veri = dogrula(paketGuncelSemasi, req.body);
    const sonuc = await Plan.updateOne({ _id: id }, { $set: veri });
    if (sonuc.matchedCount === 0) throw new HttpHata(404, "Paket bulunamadı.");
    res.json({ mesaj: "Paket güncellendi." });
  })
);

router.get(
  "/kullanicilar",
  asyncHandler(async (_req, res) => {
    const kullanicilar = await User.find({})
      .select("ad email rol emailDogrulandi dondurulduMu createdAt")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    const abonelikler = await Subscription.find({ durum: "aktif", bitis: { $gt: new Date() } })
      .populate("planId", "ad")
      .lean();
    const paketAdi = new Map(
      abonelikler.map((a) => [String(a.userId), (a.planId as unknown as { ad: string } | null)?.ad ?? "-"])
    );
    res.json({
      kullanicilar: kullanicilar.map((k) => ({
        id: String(k._id),
        ad: k.ad,
        email: k.email,
        rol: k.rol,
        emailDogrulandi: k.emailDogrulandi,
        dondurulduMu: Boolean(k.dondurulduMu),
        paket: paketAdi.get(String(k._id)) ?? null,
        olusturma: k.createdAt,
      })),
    });
  })
);

router.get(
  "/destek",
  asyncHandler(async (_req, res) => {
    const mesajlar = await SupportMessage.find({}).sort({ createdAt: -1 }).limit(200).lean();
    res.json({
      mesajlar: mesajlar.map((m) => ({
        id: String(m._id),
        ad: m.ad,
        email: m.email,
        mesaj: m.mesaj,
        durum: m.durum,
        yanit: m.yanit ?? "",
        yanitTarih: m.yanitTarih ?? null,
        tarih: m.createdAt,
      })),
    });
  })
);

router.patch(
  "/destek/:id",
  asyncHandler(async (req: Request, res) => {
    const veri = dogrula(destekDurumSemasi, req.body);
    const sonuc = await SupportMessage.updateOne({ _id: objectId(req.params.id) }, { $set: { durum: veri.durum } });
    if (sonuc.matchedCount === 0) throw new HttpHata(404, "Mesaj bulunamadı.");
    res.json({ mesaj: "Durum güncellendi." });
  })
);

router.patch(
  "/kullanicilar/:id",
  asyncHandler(async (req, res) => {
    const id = objectId(req.params.id);
    const veri = dogrula(kullaniciGuncelSemasi, req.body);
    const kullanici = await User.findById(id);
    if (!kullanici) throw new HttpHata(404, "Kullanıcı bulunamadı.");

    if (veri.dondurulduMu === true && String(id) === String(kullaniciId(req))) {
      throw new HttpHata(400, "Kendi hesabınızı donduramazsınız.");
    }
    if (veri.ad !== undefined) kullanici.ad = veri.ad;
    if (veri.email !== undefined) {
      const yeniEmail = veri.email.toLowerCase();
      const cakisan = await User.exists({ email: yeniEmail, _id: { $ne: id } });
      if (cakisan) throw new HttpHata(409, "Bu e-posta başka bir hesapta kayıtlı.");
      kullanici.email = yeniEmail;
    }
    if (veri.sifre !== undefined) kullanici.sifreHash = await hashle(veri.sifre);
    if (veri.dondurulduMu !== undefined) {
      kullanici.dondurulduMu = veri.dondurulduMu;
      if (veri.dondurulduMu) await Session.deleteMany({ userId: id });
    }
    await kullanici.save();
    res.json({ mesaj: "Kullanıcı güncellendi." });
  })
);

router.delete(
  "/kullanicilar/:id",
  asyncHandler(async (req, res) => {
    const id = objectId(req.params.id);
    if (String(id) === String(kullaniciId(req))) throw new HttpHata(400, "Kendi hesabınızı silemezsiniz.");
    const sonuc = await User.deleteOne({ _id: id });
    if (sonuc.deletedCount === 0) throw new HttpHata(404, "Kullanıcı bulunamadı.");
    await Promise.all([
      Session.deleteMany({ userId: id }),
      Subscription.deleteMany({ userId: id }),
      Favorite.deleteMany({ userId: id }),
      IzlemeOturumu.deleteMany({ userId: id }),
    ]);
    res.json({ mesaj: "Kullanıcı silindi." });
  })
);

router.post(
  "/kullanicilar/:id/abonelik",
  asyncHandler(async (req, res) => {
    const id = objectId(req.params.id);
    const veri = dogrula(abonelikEkleSemasi, req.body);
    const [kullaniciVar, plan] = await Promise.all([
      User.exists({ _id: id }),
      Plan.findById(objectId(veri.planId)).lean(),
    ]);
    if (!kullaniciVar) throw new HttpHata(404, "Kullanıcı bulunamadı.");
    if (!plan) throw new HttpHata(404, "Paket bulunamadı.");

    const baslangic = new Date();
    const bitis = new Date(baslangic);
    bitis.setMonth(bitis.getMonth() + veri.ay);

    await Subscription.updateMany({ userId: id, durum: "aktif" }, { $set: { durum: "sona_erdi" } });
    await Subscription.create({
      userId: id,
      planId: plan._id,
      ay: veri.ay,
      cihazSiniri: plan.cihazSiniri,
      durum: "aktif",
      baslangic,
      bitis,
      saglayici: "demo",
    });
    res.status(201).json({ mesaj: `${plan.ad} paketi ${veri.ay} ay için eklendi.` });
  })
);

router.post(
  "/kullanicilar/:id/gecmis-temizle",
  asyncHandler(async (req, res) => {
    const sonuc = await IzlemeOturumu.deleteMany({ userId: objectId(req.params.id) });
    res.json({ mesaj: `${sonuc.deletedCount} izleme kaydı silindi.` });
  })
);

router.post(
  "/destek/:id/yanit",
  asyncHandler(async (req, res) => {
    const veri = dogrula(destekYanitSemasi, req.body);
    const mesaj = await SupportMessage.findById(objectId(req.params.id));
    if (!mesaj) throw new HttpHata(404, "Mesaj bulunamadı.");

    mesaj.yanit = veri.yanit;
    mesaj.yanitTarih = new Date();
    mesaj.durum = "okundu";
    await mesaj.save();

    let ek = "";
    if (mesaj.email) {
      try {
        await mailGonder(mesaj.email, "Destek talebinize yanıt", veri.yanit);
        ek = " E-posta gönderildi.";
      } catch (err) {
        console.error("[mail] destek yanıtı gönderilemedi:", err instanceof Error ? err.message : err);
        ek = " E-posta gönderilemedi.";
      }
    }
    res.json({ mesaj: "Yanıt kaydedildi." + ek });
  })
);

export default router;
