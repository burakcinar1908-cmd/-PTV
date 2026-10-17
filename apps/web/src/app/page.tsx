export default function Page() {
  return (
    <main className="min-h-screen bg-[#07080c] text-[#e8eaf2]">
      <section className="px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold">IPTV Platform</h1>
        <p className="mt-4 text-[#8a90a6]">Canlı kanallar, tek hesapla.</p>
        <div className="mt-8 flex justify-center gap-3">
          <a href="/giris" className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-6 py-3 font-semibold text-white">
            Giriş yap
          </a>
          <a href="/kayit" className="rounded-xl border border-[#1f2333] px-6 py-3">
            Kayıt ol
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-6 pb-20 sm:grid-cols-3">
        {[
          ["Canlı yayın", "Kanalları takılmadan izle."],
          ["Favoriler", "Sevdiğin kanalları tek yerde tut."],
          ["Destek", "Sorununu yaz, admin cevabını burada gör."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-2xl border border-[#1f2333] bg-[#141722] p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-[#8a90a6]">{text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-[#1f2333] px-6 py-6 text-center text-sm text-[#8a90a6]">
        © IPTV Platform
      </footer>
    </main>
  );
}
