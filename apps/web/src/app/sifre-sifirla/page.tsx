import { AuthShell } from "@/components/auth/ui";
import SifreSifirlaForm from "@/components/auth/SifreSifirlaForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell baslik="Yeni şifre belirleyin">
      <SifreSifirlaForm token={token ?? ""} />
    </AuthShell>
  );
}
