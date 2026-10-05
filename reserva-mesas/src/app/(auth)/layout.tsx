import { AuthShell } from "@/components/auth/AuthShell";
import { getPublicInfo } from "@/lib/restaurant";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { info } = await getPublicInfo();
  return <AuthShell info={info}>{children}</AuthShell>;
}
