import { AuthShell } from "@/components/auth/ui";
import HesapView from "@/components/auth/HesapView";

export default function Page() {
  return (
    <AuthShell baslik="Hesabım">
      <HesapView />
    </AuthShell>
  );
}
