export type Kanal = {
  id: string;
  ad: string;
  slug: string;
  kategori: string;
  logo: string;
  aciklama: string;
};

export const SON_IZLENEN_ANAHTAR = "son-izlenen-kanallar";
const SON_IZLENEN_LIMIT = 6;

export function sonIzlenenleriOku(): Kanal[] {
  try {
    const ham = window.localStorage.getItem(SON_IZLENEN_ANAHTAR);
    return ham ? (JSON.parse(ham) as Kanal[]) : [];
  } catch {
    return [];
  }
}

export function sonIzlenenEkle(kanal: Kanal): void {
  try {
    const liste = sonIzlenenleriOku().filter((k) => k.id !== kanal.id);
    liste.unshift(kanal);
    window.localStorage.setItem(SON_IZLENEN_ANAHTAR, JSON.stringify(liste.slice(0, SON_IZLENEN_LIMIT)));
  } catch {
    // Depolama kapalıysa sessizce geç.
  }
}
