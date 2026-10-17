"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Bir şeyler ters gitti</h1>
      <p className="max-w-md text-slate-400">Sayfa yüklenirken bir hata oluştu. Yeniden deneyebilir ya da ana sayfaya dönebilirsiniz.</p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-cyan-400 px-6 py-2.5 font-medium text-slate-950 hover:bg-cyan-300">
          Yeniden dene
        </button>
        <a href="/" className="rounded-full border border-white/20 px-6 py-2.5 hover:bg-white/10">Ana sayfa</a>
      </div>
    </main>
  );
}
