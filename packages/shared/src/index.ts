export const ROLLER = ["kullanici", "yonetici"] as const;
export type Rol = (typeof ROLLER)[number];

export const ABONELIK_DURUMLARI = ["aktif", "beklemede", "iptal", "suresi_doldu"] as const;
export type AbonelikDurumu = (typeof ABONELIK_DURUMLARI)[number];
