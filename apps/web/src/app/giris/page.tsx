import { AuthShell, AltBaglanti } from "@/components/auth/ui";
import GirisForm from "@/components/auth/GirisForm";

export default function Page() {
  return (
    <AuthShell baslik="Giriş yapın" altyazi="Hesabınıza devam etmek için bilgilerinizi girin.">
      <GirisForm />
      <AltBaglanti>
        Hesabınız yok mu? <a href="/kayit" className="text-[var(--accent)] hover:text-[var(--accent)]">Kayıt olun</a>
      </AltBaglanti>
    </AuthShell>
  );
}
