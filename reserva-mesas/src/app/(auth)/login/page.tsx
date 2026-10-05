import Link from "next/link";
import type { Metadata } from "next";
import { AuthDivider, AuthHeading } from "@/components/auth/AuthHeading";
import { DemoLoginButtons } from "@/components/auth/DemoLoginButtons";
import { safeNextPath } from "@/lib/auth";
import { isDemoMode } from "@/lib/restaurant";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);

  return (
    <div>
      <AuthHeading
        title="Bem-vindo de volta"
        subtitle="Entre para ver e gerenciar suas reservas."
      />

      <LoginForm next={next} />

      <AuthDivider />

      <p className="text-center text-sm text-stone-500">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand-ink hover:underline">
          Criar conta
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-stone-500">
        Não precisa de conta para reservar.{" "}
        <Link href="/reservar" className="font-medium text-brand-ink hover:underline">
          Reservar agora
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-stone-500">
        <Link href="/painel/entrar" className="inline-block min-h-tap py-3 hover:text-stone-700">
          Sou da equipe do restaurante
        </Link>
      </p>

      {isDemoMode() && <DemoLoginButtons />}
    </div>
  );
}
