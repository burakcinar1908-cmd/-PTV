import type { Kanal } from "@/lib/kanal";

type Props = {
  kanal: Kanal;
  favori?: boolean | null;
  onFavori?: () => void;
};

export default function KanalKarti({ kanal, favori, onFavori }: Props) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white/5 transition duration-300  hover:border-[var(--accent)] ">
      <a href={`/izle/${kanal.id}`} className="block">
        <div className="flex aspect-video items-center justify-center">
          {kanal.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kanal.logo} alt={kanal.ad} loading="lazy" className="max-h-20 max-w-[70%] object-contain" />
          ) : (
            <span className="text-4xl font-semibold text-[var(--accent)]">{kanal.ad.charAt(0)}</span>
          )}
        </div>
        <div className="p-4">
          <span className="text-xs uppercase tracking-widest text-[var(--accent)]">{kanal.kategori}</span>
          <h3 className="mt-1 font-medium text-[var(--text)]">{kanal.ad}</h3>
        </div>
      </a>
      {favori !== undefined && (
        <button
          type="button"
          onClick={onFavori}
          aria-label={favori ? "Favorilerden çıkar" : "Favorilere ekle"}
          disabled={favori === null}
          className="absolute right-3 top-3 rounded-full bg-[var(--bg)]/80 px-3 py-1.5 text-sm transition hover:bg-[var(--bg)] disabled:opacity-50"
        >
          {favori ? "★" : "☆"}
        </button>
      )}
    </article>
  );
}
