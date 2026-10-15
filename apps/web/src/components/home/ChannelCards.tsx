const KANALLAR = [
  { ad: "Örnek Haber 1", kategori: "Haber", renk: "from-cyan-500/30" },
  { ad: "Örnek Spor 1", kategori: "Spor", renk: "from-emerald-500/30" },
  { ad: "Örnek Belgesel", kategori: "Belgesel", renk: "from-indigo-500/30" },
  { ad: "Örnek Müzik", kategori: "Müzik", renk: "from-fuchsia-500/30" },
];

export default function ChannelCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-3xl font-semibold md:text-4xl">Kanallardan örnekler</h2>
      <p className="mt-3 text-slate-400">Demo amaçlı örnek kanal kartları.</p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {KANALLAR.map((k) => (
          <article
            key={k.ad}
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${k.renk} to-slate-900 p-6 transition hover:scale-[1.02]`}
          >
            <span className="text-xs uppercase tracking-widest text-slate-300">{k.kategori}</span>
            <h3 className="mt-16 text-lg font-medium">{k.ad}</h3>
            <p className="mt-1 text-sm text-slate-400">Yayın bilgisi yakında</p>
          </article>
        ))}
      </div>
    </section>
  );
}
