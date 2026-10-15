import { AuthShell } from "@/components/auth/ui";
import SifreSifirlaIsteForm from "@/components/auth/SifreSifirlaIsteForm";

export default function Page() {
  return (
    <AuthShell baslik="Şifrenizi sıfırlayın" altyazi="E-posta adresinize sıfırlama bağlantısı göndereceğiz.">
      <SifreSifirlaIsteForm />
    </AuthShell>
  );
}
