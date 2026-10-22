const KANALLAR = [
  { ad: "Örnek Haber 1", kategori: "Haber" },
  { ad: "Örnek Spor 1", kategori: "Spor" },
  { ad: "Örnek Belgesel", kategori: "Belgesel" },
  { ad: "Örnek Müzik", kategori: "Müzik" },
];

export default function ChannelCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-3xl font-semibold md:text-4xl">Kanallardan örnekler</h2>
      <p className="mt-3 text-[var(--muted)]">Demo amaçlı örnek kanal kartları.</p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {KANALLAR.map((k) => (
          <article key={k.ad} className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
            <span className="text-xs uppercase tracking-widest text-[var(--muted)]">{k.kategori}</span>
            <h3 className="mt-16 text-lg font-medium">{k.ad}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Yayın bilgisi yakında</p>
          </article>
        ))}
      </div>
    </section>
  );
}
