import YasalSayfa from "@/components/sayfa/YasalSayfa";

export default function Page() {
  return (
    <YasalSayfa baslik="İletişim">
      <p>Sorularınız, önerileriniz ve teknik destek talepleriniz için bize ulaşabilirsiniz.</p>
      <p>E-posta: <a href="mailto:destek@ornek.com" className="text-cyan-300 hover:text-cyan-200">destek@ornek.com</a></p>
      <p>Daha hızlı yanıt için sağ alttaki <strong className="text-slate-100">Destek</strong> penceresinden mesaj gönderebilirsiniz.</p>
    </YasalSayfa>
  );
}
