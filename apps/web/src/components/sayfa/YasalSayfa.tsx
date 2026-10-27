import type { ReactNode } from "react";

export default function YasalSayfa({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-12">
      <h1 className="text-3xl font-semibold md:text-4xl">{baslik}</h1>
      <div className="mt-8 space-y-5 leading-relaxed text-[var(--muted)]">{children}</div>
    </main>
  );
}
