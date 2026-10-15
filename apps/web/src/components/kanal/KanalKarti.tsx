import type { Kanal } from "@/lib/kanal";

type Props = {
  kanal: Kanal;
  favori?: boolean | null;
  onFavori?: () => void;
};

export default function KanalKarti({ kanal, favori, onFavori }: Props) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_0_40px_-10px_rgba(103,232,249,0.4)]">
      <a href={`/izle/${kanal.id}`} className="block">
        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-cyan-500/20 via-slate-900 to-indigo-600/20">
          {kanal.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kanal.logo} alt={kanal.ad} loading="lazy" className="max-h-20 max-w-[70%] object-contain" />
          ) : (
            <span className="text-4xl font-semibold text-cyan-200/80">{kanal.ad.charAt(0)}</span>
          )}
        </div>
        <div className="p-4">
          <span className="text-xs uppercase tracking-widest text-cyan-300/80">{kanal.kategori}</span>
          <h3 className="mt-1 font-medium text-slate-100">{kanal.ad}</h3>
        </div>
      </a>
      {favori !== undefined && (
        <button
          type="button"
          onClick={onFavori}
          aria-label={favori ? "Favorilerden çıkar" : "Favorilere ekle"}
          disabled={favori === null}
          className="absolute right-3 top-3 rounded-full bg-slate-950/70 px-3 py-1.5 text-sm backdrop-blur transition hover:bg-slate-950 disabled:opacity-50"
        >
          {favori ? "★" : "☆"}
        </button>
      )}
    </article>
  );
}
