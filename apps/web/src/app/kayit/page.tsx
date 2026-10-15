import { AuthShell, AltBaglanti } from "@/components/auth/ui";
import KayitForm from "@/components/auth/KayitForm";

export default function Page() {
  return (
    <AuthShell baslik="Hesap oluşturun" altyazi="Birkaç adımda izlemeye başlayın.">
      <KayitForm />
      <AltBaglanti>
        Zaten hesabınız var mı? <a href="/giris" className="text-cyan-300 hover:text-cyan-200">Giriş yapın</a>
      </AltBaglanti>
    </AuthShell>
  );
}
