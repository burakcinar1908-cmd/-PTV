import YasalSayfa from "@/components/sayfa/YasalSayfa";

export default function Page() {
  return (
    <YasalSayfa baslik="Gizlilik Politikası">
      <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--warning)]">
        Bu metin taslaktır. Yayına almadan önce KVKK uyumu konusunda bir hukuk danışmanı tarafından gözden geçirilmelidir.
      </p>
      <p>Hesap oluştururken paylaştığınız ad ve e-posta adresiniz, hizmeti sunmak ve sizinle iletişim kurmak için işlenir. Şifreler yalnızca güvenli biçimde özetlenerek saklanır.</p>
      <p>Destek mesajlarınızda paylaştığınız bilgiler yalnızca talebinizi yanıtlamak için kullanılır.</p>
      <p>Ödeme kartı bilgileriniz platformda saklanmaz. Ödeme işlemleri ileride lisanslı bir ödeme sağlayıcısı üzerinden yapılacaktır.</p>
      <p>Hakkınızda tuttuğumuz verilerin silinmesini veya düzeltilmesini istemek için destek kanallarından bize ulaşabilirsiniz.</p>
    </YasalSayfa>
  );
}
