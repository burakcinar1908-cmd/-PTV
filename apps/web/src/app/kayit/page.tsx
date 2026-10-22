import { AuthShell, AltBaglanti } from "@/components/auth/ui";
import KayitForm from "@/components/auth/KayitForm";

export default function Page() {
  return (
    <AuthShell baslik="Hesap oluşturun" altyazi="Birkaç adımda izlemeye başlayın.">
      <KayitForm />
      <AltBaglanti>
        Zaten hesabınız var mı? <a href="/giris" className="text-[var(--accent)] hover:text-[var(--accent)]">Giriş yapın</a>
      </AltBaglanti>
    </AuthShell>
  );
}
