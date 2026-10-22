import YasalSayfa from "@/components/sayfa/YasalSayfa";

export default function Page() {
  return (
    <YasalSayfa baslik="Kullanım Koşulları">
      <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--warning)]">
        Bu metin taslaktır. Yayına almadan önce hukuk danışmanı tarafından gözden geçirilmelidir.
      </p>
      <p>Hizmeti yalnızca kişisel ve paketinizde belirtilen cihaz sınırı içinde kullanabilirsiniz. Hesap bilgilerinizi başkalarıyla paylaşmanız yasaktır.</p>
      <p>Yayınların içeriği ve yayın hakları platforma ait değildir. Hizmette sunulan kanalların kullanım hakları, sağlanan kaynaklara bağlıdır.</p>
      <p>Platform, hizmette değişiklik yapma ve kesinti yaşanabileceğini bildirir. Bu koşulları ihlal eden hesaplar askıya alınabilir.</p>
    </YasalSayfa>
  );
}
