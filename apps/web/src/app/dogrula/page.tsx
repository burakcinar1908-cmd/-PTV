import { AuthShell } from "@/components/auth/ui";
import DogrulaForm from "@/components/auth/DogrulaForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell baslik="E-posta doğrulama">
      <DogrulaForm token={token ?? ""} />
    </AuthShell>
  );
}
