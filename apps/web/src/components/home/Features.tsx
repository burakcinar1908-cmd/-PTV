const OZELLIKLER = [
  { baslik: "Paketinize özel kanallar", metin: "Seçtiğiniz paketin kanal listesine göre canlı yayınları izleyin." },
  { baslik: "Aynı anda birden fazla cihaz", metin: "Paketinizdeki cihaz sınırına kadar aynı anda izleyin." },
  { baslik: "Favoriler ve son izlenenler", metin: "En sevdiğiniz kanallara bir dokunuşla dönün." },
  { baslik: "Kesintisiz yayın", metin: "Yayın kopmalarında otomatik yeniden bağlanma ve açık hata bildirimi." },
];

export default function Features() {
  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1fr_1.4fr]">
        <h2 className="text-4xl md:text-5xl">Neden bu platform?</h2>
        <dl className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {OZELLIKLER.map((o) => (
            <div key={o.baslik} className="py-6">
              <dt className="text-xl font-medium">{o.baslik}</dt>
              <dd className="mt-2 max-w-[60ch] text-[var(--muted)]">{o.metin}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
