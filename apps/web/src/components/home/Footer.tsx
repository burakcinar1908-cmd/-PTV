const BAG = "inline-flex min-h-[44px] items-center hover:text-[var(--text)]";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-6 py-12 text-[0.9375rem] text-[var(--muted)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:justify-between">
        <div>
          <p className="font-display text-2xl font-semibold text-[var(--text)]">IPTV Platform</p>
          <p className="mt-2">
            Yardım için{" "}
            <a className="underline underline-offset-4 hover:text-[var(--text)]" href="mailto:destek@ornek.com">
              destek@ornek.com
            </a>
          </p>
        </div>
        <nav aria-label="Alt menü" className="flex flex-wrap gap-x-6">
          <a href="/yardim" className={BAG}>Yardım</a>
          <a href="/iletisim" className={BAG}>İletişim</a>
          <a href="/gizlilik" className={BAG}>Gizlilik politikası</a>
          <a href="/kullanim-kosullari" className={BAG}>Kullanım koşulları</a>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-sm">© {new Date().getFullYear()} IPTV Platform. Tüm hakları saklıdır.</p>
    </footer>
  );
}
