import { AuthShell, AltBaglanti } from "@/components/auth/ui";
import GirisForm from "@/components/auth/GirisForm";

export default function Page() {
  return (
    <AuthShell baslik="Giriş yapın" altyazi="Hesabınıza devam etmek için bilgilerinizi girin.">
      <GirisForm />
      <AltBaglanti>
        Hesabınız yok mu? <a href="/kayit" className="text-cyan-300 hover:text-cyan-200">Kayıt olun</a>
      </AltBaglanti>
    </AuthShell>
  );
}
