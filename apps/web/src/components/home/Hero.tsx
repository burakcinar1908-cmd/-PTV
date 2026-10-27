// Televizyonun en tanıdık görüntüsü: test yayını. Tamamen CSS ile çizilir, dosya ya da kütüphane gerektirmez.
const CUBUKLAR = ["#bfbfbf", "#bfbf30", "#30bfbf", "#30bf30", "#bf30bf", "#bf3030", "#3030bf"];
const ALT_CUBUKLAR = ["#3030bf", "#000000", "#bf30bf", "#000000", "#30bfbf", "#000000", "#bfbfbf"];

function seritGradyani(renkler: string[]): string {
  const adim = 100 / renkler.length;
  const duraklar = renkler.map((r, i) => `${r} ${(i * adim).toFixed(3)}% ${((i + 1) * adim).toFixed(3)}%`);
  return `linear-gradient(90deg, ${duraklar.join(", ")})`;
}

function TestGoruntusu() {
  return (
    <div aria-hidden="true" className="ekran-ac rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5">
      <div className="relative aspect-video overflow-hidden rounded-[10px] bg-black">
        <div className="absolute inset-x-0 top-0 h-[68%]" style={{ background: seritGradyani(CUBUKLAR) }} />
        <div className="absolute inset-x-0 top-[68%] h-[8%]" style={{ background: seritGradyani(ALT_CUBUKLAR) }} />
        <div className="absolute inset-x-0 bottom-0 flex h-[24%] items-center justify-between bg-black px-4">
          <span className="font-display text-xl font-semibold text-white md:text-2xl">IPTV Platform</span>
          <span className="inline-flex items-center gap-2 text-sm text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            Canlı
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
      <div>
        <h1 className="text-6xl md:text-8xl">Canlı yayın, tek ekranda.</h1>
        <p className="mt-6 max-w-[34ch] text-lg text-[var(--muted)]">
          Paketinize dahil kanalları ülkeye ve türe göre bulun, favorilerinize ekleyin ve telefonda ya da bilgisayarda izleyin.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/kanallar" className="btn-primary">
            Kanalları aç
          </a>
          <a href="#paketler" className="btn-secondary">
            Paketleri incele
          </a>
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">Demo sürümü: paketler şu an ücretsiz.</p>
      </div>
      <TestGoruntusu />
    </section>
  );
}
