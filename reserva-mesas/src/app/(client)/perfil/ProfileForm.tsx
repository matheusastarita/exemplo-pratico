"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Card } from "@/components/ui/Card";
import { maskPhoneInput, normalizePhoneBR } from "@/lib/format";
import type { ProfileRow } from "@/lib/types";

type ProfileData = Pick<ProfileRow, "id" | "full_name" | "phone" | "birthday" | "preferences">;

export function ProfileForm({ email, profile }: { email: string; profile: ProfileData }) {
  return (
    <div className="flex flex-col gap-6">
      <EditProfileCard email={email} profile={profile} />
      <ChangePasswordCard email={email} />
    </div>
  );
}

function EditProfileCard({ email, profile }: { email: string; profile: ProfileData }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ? maskPhoneInput(profile.phone) : "");
  const [birthday, setBirthday] = useState(profile.birthday ?? "");
  const [preferences, setPreferences] = useState(profile.preferences ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const normalized = phone ? normalizePhoneBR(phone) : null;
    if (fullName.trim().length < 2) return setError("Informe seu nome completo.");
    if (phone && !normalized) return setError("Celular inválido. Use DDD + número.");

    setSaving(true);
    const { error: updateError } = await createClient()
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: normalized,
        birthday: birthday || null,
        preferences: preferences.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);

    if (updateError) return setError("Não foi possível salvar. Tente novamente.");
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-stone-900">Meus dados</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input id="email" label="E-mail" value={email} disabled />
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
          value={phone}
          onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
          hint="Usamos para preencher suas próximas reservas."
        />
        <Input
          id="birthday"
          label="Aniversário (opcional)"
          type="date"
          autoComplete="bday"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
        />
        <Textarea
          id="preferences"
          label="Alergias e preferências (opcional)"
          placeholder="Ex.: alergia a amendoim, prefiro a varanda"
          value={preferences}
          maxLength={300}
          onChange={(e) => setPreferences(e.target.value)}
          hint="Dado sensível: usado só para cuidar de você nas suas visitas."
        />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="text-sm text-status-confirmed">
            Dados atualizados.
          </p>
        )}

        <Button type="submit" disabled={saving} className="mt-1 w-full">
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </Card>
  );
}

function ChangePasswordCard({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!currentPassword) return setError("Informe sua senha atual.");
    if (password.length < 8) return setError("A nova senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");

    setSaving(true);
    const supabase = createClient();

    // Confirma a senha atual antes de trocar — o Supabase não tem um endpoint
    // dedicado pra isso, então a forma padrão é entrar de novo com ela.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (reauthError) {
      setSaving(false);
      return setError("Senha atual incorreta.");
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) return setError("Não foi possível alterar a senha. Tente novamente.");

    setCurrentPassword("");
    setPassword("");
    setConfirm("");
    setSaved(true);
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-stone-900">Alterar senha</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordInput
          id="currentPassword"
          label="Senha atual"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <PasswordInput
          id="newPassword"
          label="Nova senha"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirmar nova senha"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="text-sm text-status-confirmed">
            Senha alterada.
          </p>
        )}
        <Button type="submit" variant="secondary" disabled={saving} className="w-full">
          {saving ? "Salvando..." : "Alterar senha"}
        </Button>
      </form>
    </Card>
  );
}
