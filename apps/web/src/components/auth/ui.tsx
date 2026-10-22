import type { InputHTMLAttributes, ReactNode } from "react";

export function AuthShell({ baslik, altyazi, children }: { baslik: string; altyazi?: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-white/5 p-8  ">
        <h1 className="text-2xl font-semibold">{baslik}</h1>
        {altyazi && <p className="mt-2 text-sm text-[var(--muted)]">{altyazi}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

export function Alan({ etiket, ...props }: InputHTMLAttributes<HTMLInputElement> & { etiket: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-[var(--muted)]">{etiket}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/60 px-4 py-3 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
      />
    </label>
  );
}

export function Dugme({ children, ...props }: { children: ReactNode; disabled?: boolean; type?: "submit" | "button"; onClick?: () => void }) {
  return (
    <button
      {...props}
      className="w-full rounded-full bg-[var(--accent)] py-3 font-medium text-[var(--accent-ink)] transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function Bildirim({ tur, children }: { tur: "hata" | "basari"; children: ReactNode }) {
  const renk = tur === "hata" ? "border-rose-400/40 bg-rose-500/10 text-[var(--danger)]" : "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent)]";
  return <div role="alert" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${renk}`}>{children}</div>;
}

export function AltBaglanti({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-center text-sm text-[var(--muted)]">{children}</p>;
}
