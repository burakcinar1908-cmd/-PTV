// 3D sahne yüklenene, desteklenmeyene ya da hareket azaltma açıkken görünen sade zemin.
export default function SceneFallback() {
  return <div aria-hidden="true" className="absolute inset-0 bg-[var(--surface)] opacity-60" />;
}
