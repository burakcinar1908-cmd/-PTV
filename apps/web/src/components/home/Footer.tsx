export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-6 py-12 text-sm text-[var(--muted)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:justify-between">
        <div>
          <p className="text-[var(--text)]">IPTV Platform</p>
          <p className="mt-2">Yardım: destek@ornek.com</p>
        </div>
        <nav className="flex flex-wrap gap-6">
          <a href="/yardim" className="hover:text-white">Yardım</a>
          <a href="/iletisim" className="hover:text-white">İletişim</a>
          <a href="/gizlilik" className="hover:text-white">Gizlilik Politikası</a>
          <a href="/kullanim-kosullari" className="hover:text-white">Kullanım Koşulları</a>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-6xl">© {new Date().getFullYear()} IPTV Platform. Tüm hakları saklıdır.</p>
    </footer>
  );
}
