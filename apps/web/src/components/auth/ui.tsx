import type { InputHTMLAttributes, ReactNode } from "react";

export function AuthShell({ baslik, altyazi, children }: { baslik: string; altyazi?: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-semibold">{baslik}</h1>
        {altyazi && <p className="mt-2 text-sm text-slate-400">{altyazi}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

export function Alan({ etiket, ...props }: InputHTMLAttributes<HTMLInputElement> & { etiket: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-slate-300">{etiket}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
      />
    </label>
  );
}

export function Dugme({ children, ...props }: { children: ReactNode; disabled?: boolean; type?: "submit" | "button"; onClick?: () => void }) {
  return (
    <button
      {...props}
      className="w-full rounded-full bg-cyan-400 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function Bildirim({ tur, children }: { tur: "hata" | "basari"; children: ReactNode }) {
  const renk = tur === "hata" ? "border-rose-400/40 bg-rose-500/10 text-rose-200" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  return <div role="alert" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${renk}`}>{children}</div>;
}

export function AltBaglanti({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-center text-sm text-slate-400">{children}</p>;
}
