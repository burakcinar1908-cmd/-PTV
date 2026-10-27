import type { Kanal } from "@/lib/kanal";

type Props = {
  kanal: Kanal;
  favori?: boolean | null;
  onFavori?: () => void;
};

export default function KanalKarti({ kanal, favori, onFavori }: Props) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors duration-150 hover:border-[var(--accent)]">
      <a href={`/izle/${kanal.id}`} className="block">
        <div className="flex aspect-video items-center justify-center bg-[var(--bg)]">
          {kanal.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kanal.logo} alt="" loading="lazy" decoding="async" className="max-h-[70%] max-w-[70%] object-contain" />
          ) : (
            <span aria-hidden="true" className="font-display text-5xl font-semibold text-[var(--accent)]">
              {kanal.ad.charAt(0)}
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--muted)]">{kanal.kategori}</p>
          <h3 className="mt-1 font-sans text-base font-medium leading-snug">{kanal.ad}</h3>
        </div>
      </a>
      {favori !== undefined && (
        <button
          type="button"
          onClick={onFavori}
          aria-pressed={favori === true}
          aria-label={favori ? `${kanal.ad} favorilerden çıkar` : `${kanal.ad} favorilere ekle`}
          className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--bg)] text-lg text-[var(--text)] transition-colors duration-150 hover:text-[var(--accent)]"
        >
          {favori ? "★" : "☆"}
        </button>
      )}
    </article>
  );
}
