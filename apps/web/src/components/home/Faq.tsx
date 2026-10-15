"use client";

import { useState } from "react";

const SORULAR = [
  { s: "Hangi cihazlarda izleyebilirim?", c: "Web tarayıcısı ve mobil cihazlarda, paketinizde belirtilen eşzamanlı cihaz sayısı kadar izleme yapabilirsiniz." },
  { s: "Aboneliğimi istediğim zaman iptal edebilir miyim?", c: "Evet. Aboneliğinizi hesap sayfanızdan istediğiniz zaman iptal edebilirsiniz." },
  { s: "Ödemelerim güvende mi?", c: "Ödemeler, lisanslı bir ödeme sağlayıcısının güvenli sayfasında alınır. Kart bilgileriniz platformda saklanmaz." },
];

export default function Faq() {
  const [acik, setAcik] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <h2 className="text-3xl font-semibold md:text-4xl">Sık sorulan sorular</h2>
      <div className="mt-10 space-y-3">
        {SORULAR.map((q, i) => (
          <div key={q.s} className="rounded-xl border border-white/10 bg-white/5">
            <button
              onClick={() => setAcik(acik === i ? null : i)}
              aria-expanded={acik === i}
              className="flex w-full items-center justify-between px-6 py-4 text-left font-medium"
            >
              {q.s}
              <span className="text-cyan-300">{acik === i ? "−" : "+"}</span>
            </button>
            {acik === i && <p className="px-6 pb-5 text-slate-400">{q.c}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
