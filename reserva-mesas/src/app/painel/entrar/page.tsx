import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthHeading } from "@/components/auth/AuthHeading";
import { DemoLoginButtons } from "@/components/auth/DemoLoginButtons";
import { LoginForm } from "@/app/(auth)/login/LoginForm";
import { getPublicInfo, isDemoMode } from "@/lib/restaurant";
import { safeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar no painel" };

/** Login da equipe (anfitrião e gerente). Fica fora de /painel/(app) pra não exigir sessão. */
export default async function StaffLoginPage({ searchParams }: PageProps<"/painel/entrar">) {
  const { info } = await getPublicInfo();
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);

  return (
    <AuthShell info={info} eyebrow="Painel do restaurante">
      <AuthHeading title="Bom te ver" subtitle={`Acesse o salão e as reservas do ${info.name}.`} />
      <LoginForm next={next} staffOnly />
      <p className="mt-6 text-center text-xs text-stone-500">
        <Link href="/reservar" className="inline-block min-h-tap py-3 hover:text-stone-700">
          Sou cliente, quero reservar uma mesa
        </Link>
      </p>
      {isDemoMode() && <DemoLoginButtons />}
    </AuthShell>
  );
}
