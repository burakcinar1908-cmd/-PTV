import { Channel } from "../db/models/Channel.js";
import { slugOlustur } from "./m3u.js";

export async function benzersizKanalSlug(ad: string): Promise<string> {
  const temel = slugOlustur(ad);
  let aday = temel;
  let sayac = 2;
  while (await Channel.exists({ slug: aday })) {
    aday = `${temel}-${sayac}`;
    sayac++;
  }
  return aday;
}
