"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { AuthHeading } from "@/components/auth/AuthHeading";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/atualizar-senha`,
    });
    setLoading(false);
    // Sempre a mesma resposta, exista ou não a conta (não revela e-mails cadastrados).
    setSent(true);
  }

  if (sent) {
    return (
      <Card className="text-center">
        <h1 className="mb-2 text-lg font-semibold text-stone-900">Verifique seu e-mail</h1>
        <p className="text-sm text-stone-600">
          Se <span className="font-medium">{email}</span> estiver cadastrado, você vai receber um
          link para criar uma nova senha. Confira também a caixa de spam.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block min-h-tap py-3 text-sm font-medium text-brand-ink hover:underline"
        >
          Voltar para o login
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <AuthHeading
        title="Recuperar senha"
        subtitle="Digite seu e-mail e enviaremos um link para criar uma nova senha."
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
          {loading ? "Enviando..." : "Enviar link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href="/login" className="font-medium text-brand-ink hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
