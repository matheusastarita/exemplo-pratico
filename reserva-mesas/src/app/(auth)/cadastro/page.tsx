"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { maskPhoneInput, normalizePhoneBR } from "@/lib/format";
import { CLIENT_HOME } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Card } from "@/components/ui/Card";
import { AuthHeading } from "@/components/auth/AuthHeading";

export default function CadastroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }
    const normalizedPhone = normalizePhoneBR(phone);
    if (!normalizedPhone) {
      setError("Telefone inválido. Use DDD + número.");
      return;
    }
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (!accepted) {
      setError("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Só dados pessoais vão nos metadados — o papel (cliente/equipe) nunca vem daqui.
        data: { full_name: fullName.trim(), phone: normalizedPhone },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${CLIENT_HOME}`,
      },
    });
    setLoading(false);

    if (signUpError) {
      // Genérico de propósito: não confirma se o e-mail já tem cadastro.
      setError(
        "Não foi possível criar a conta com esses dados. Se você já tem cadastro, entre ou recupere sua senha."
      );
      return;
    }

    if (data.session) {
      router.push(CLIENT_HOME);
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <Card className="text-center">
        <h1 className="mb-2 text-lg font-semibold text-stone-900">Confirme seu e-mail</h1>
        <p className="text-sm text-stone-600">
          Se o endereço <span className="font-medium">{email}</span> puder ser usado, você vai
          receber um link de confirmação. Depois de confirmar, é só entrar.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block min-h-tap py-3 text-sm font-medium text-brand-ink hover:underline"
        >
          Ir para o login
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <AuthHeading title="Criar conta" subtitle="Acompanhe suas reservas e reserve em segundos." />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="fullName"
          label="Nome completo"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          id="phone"
          label="Celular (WhatsApp)"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(11) 98888-7777"
          required
          value={phone}
          onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
        />
        <Input
          id="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput
          id="password"
          label="Senha (mínimo 8 caracteres)"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="flex items-start gap-3 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-300 accent-[rgb(var(--c-brand))]"
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" className="font-medium text-brand-ink underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="font-medium text-brand-ink underline">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-brand-ink hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
