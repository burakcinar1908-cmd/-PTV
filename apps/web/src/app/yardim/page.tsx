import YasalSayfa from "@/components/sayfa/YasalSayfa";

export default function Page() {
  return (
    <YasalSayfa baslik="Yardım">
      <h2 className="text-xl font-medium text-slate-100">Nasıl başlarım?</h2>
      <p>Önce hesap oluşturun ve e-posta adresinizi doğrulayın. Ardından giriş yapıp bir paket seçin. Paket seçmeden kanal listesini göremezsiniz.</p>
      <h2 className="text-xl font-medium text-slate-100">Paketler ve süreler</h2>
      <p>Her paket farklı bir kanal listesi sunar ve aynı anda izleyebileceğiniz cihaz sayısı paketinize göre değişir. Paketler 1 aylık, 3 aylık ve yıllık seçeneklerle sunulur.</p>
      <h2 className="text-xl font-medium text-slate-100">Yayın açılmıyor</h2>
      <p>Yayın 20 saniyede başlamazsa önce sayfayı yenileyip tekrar deneyin. Sorun sürerse sağ alttaki destek penceresinden bize yazın, hangi kanalda sorun yaşadığınızı belirtmeniz yeterli.</p>
      <h2 className="text-xl font-medium text-slate-100">Cihaz sınırı</h2>
      <p>Paketinizdeki cihaz sayısına ulaştığınızda yeni bir yayın açmak için diğer izlemelerden birini kapatmanız gerekir.</p>
    </YasalSayfa>
  );
}
