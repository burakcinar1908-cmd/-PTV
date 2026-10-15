export class HttpHata extends Error {
  constructor(public durum: number, mesaj: string) {
    super(mesaj);
  }
}
