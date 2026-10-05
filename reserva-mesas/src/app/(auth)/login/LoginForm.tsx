"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { homeForRole } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { IconInput } from "@/components/ui/IconInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { MailIcon } from "@/components/icons";

/** Formulário de login (cliente e equipe usam o mesmo Supabase Auth). */
export function LoginForm({
  next,
  staffOnly = false,
  forgotHref = "/recuperar-senha",
}: {
  next: string | null;
  /** Tela da equipe: recusa contas de cliente. */
  staffOnly?: boolean;
  forgotHref?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      // Mensagem genérica: não revela se o e-mail existe.
      setError("E-mail ou senha inválidos.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", data.user.id)
      .single();

    const isStaff = profile?.active && (profile.role === "host" || profile.role === "manager");
    if (staffOnly && !isStaff) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Essa conta não tem acesso ao painel do restaurante.");
      return;
    }

    router.push(next ?? homeForRole(isStaff ? profile?.role : "client"));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate={false}>
      <IconInput
        id="email"
        type="email"
        label="E-mail"
        icon={<MailIcon size={18} />}
        placeholder="seu@email.com"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div>
        <PasswordInput
          id="password"
          label="Senha"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Link
          href={forgotHref}
          className="mt-2 inline-block min-h-tap w-full py-2 text-right text-sm text-brand-ink hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
