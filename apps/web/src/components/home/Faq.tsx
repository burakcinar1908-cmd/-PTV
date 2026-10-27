const SORULAR = [
  { s: "Hangi cihazlarda izleyebilirim?", c: "Web tarayıcısı ve mobil cihazlarda, paketinizde belirtilen eşzamanlı cihaz sayısı kadar izleme yapabilirsiniz." },
  { s: "Aboneliğimi istediğim zaman iptal edebilir miyim?", c: "Evet. Aboneliğinizi hesap sayfanızdan istediğiniz zaman iptal edebilirsiniz." },
  { s: "Ödemelerim güvende mi?", c: "Şu an demo sürümdesiniz ve ödeme alınmaz. Gerçek ödeme sistemi açıldığında bu bölüm güncellenecek." },
];

export default function Faq() {
  return (
    <section className="border-t border-[var(--border)]">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-4xl md:text-5xl">Sık sorulan sorular</h2>
        <div className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {SORULAR.map((q, i) => (
            <details key={q.s} open={i === 0}>
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {q.s}
                <span aria-hidden="true" className="faq-arti text-2xl text-[var(--accent)] transition-transform duration-150">
                  +
                </span>
              </summary>
              <p className="max-w-[60ch] pb-6 text-[var(--muted)]">{q.c}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
