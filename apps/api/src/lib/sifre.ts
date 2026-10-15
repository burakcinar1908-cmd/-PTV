import bcrypt from "bcryptjs";

const TUR = 12;

export const hashle = (sifre: string) => bcrypt.hash(sifre, TUR);
export const karsilastir = (sifre: string, hash: string) => bcrypt.compare(sifre, hash);
