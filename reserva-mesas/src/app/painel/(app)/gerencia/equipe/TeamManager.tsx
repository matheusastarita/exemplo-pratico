"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ActionsMenu, type ActionItem } from "@/components/ui/ActionsMenu";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { GroupLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { Toast, useToast } from "@/components/ui/Toast";
import { MailIcon, PlusIcon } from "@/components/icons";
import { ROLE_LABEL, friendlyErrorMessage } from "@/lib/constants";
import { daysSince } from "@/lib/dates";
import type { TeamData } from "@/lib/types";

type Member = TeamData["members"][number];
type StaffRole = "host" | "manager";

const ROLE_HINT: Record<StaffRole, string> = {
  host: "Painel do salão: reservas do dia, mapa de mesas, fila de espera e walk-in.",
  manager: "Tudo do anfitrião e mais a gerência: clientes, mesas, regras, relatórios, equipe e configurações.",
};

function lastAccess(iso: string | null): string {
  if (!iso) return "Nunca entrou";
  // Dia do último acesso no fuso do restaurante, comparado com hoje
  const day = new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const days = daysSince(day);
  if (days <= 0) return "Entrou hoje";
  if (days === 1) return "Entrou ontem";
  return `Entrou há ${days} dias`;
}

export function TeamManager({ initial }: { initial: TeamData }) {
  const supabase = useMemo(() => createClient(), []);
  const [team, setTeam] = useState(initial);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ member: Member; action: "deactivate" | "remove" } | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast, show, clear } = useToast();

  async function reload() {
    const { data } = await supabase.rpc("list_team");
    if (data) setTeam(data);
  }

  async function setStaff(m: Member, role: "client" | StaffRole, active: boolean, message: string) {
    setBusy(true);
    const { error } = await supabase.rpc("set_staff", { p_user_id: m.id, p_role: role, p_active: active });
    setBusy(false);
    setConfirm(null);
    if (error) return show(friendlyErrorMessage(error), "error");
    await reload();
    show(message);
  }

  async function revoke(email: string) {
    const { error } = await supabase.rpc("revoke_invite", { p_email: email });
    if (error) return show(friendlyErrorMessage(error), "error");
    await reload();
    show("Convite cancelado.");
  }

  function actionsFor(m: Member): ActionItem[] {
    const name = m.full_name || m.email;
    const items: ActionItem[] = [];
    if (m.active) {
      items.push(
        m.role === "manager"
          ? { label: "Tornar anfitrião", onSelect: () => setStaff(m, "host", true, `${name} agora é anfitrião.`) }
          : { label: "Tornar gerente", onSelect: () => setStaff(m, "manager", true, `${name} agora é gerente.`) }
      );
      items.push({ label: "Desativar acesso", tone: "danger", onSelect: () => setConfirm({ member: m, action: "deactivate" }) });
    } else {
      items.push({ label: "Reativar acesso", onSelect: () => setStaff(m, m.role as StaffRole, true, `Acesso de ${name} reativado.`) });
    }
    items.push({ label: "Remover da equipe", tone: "danger", onSelect: () => setConfirm({ member: m, action: "remove" }) });
    return items;
  }

  const active = team.members.filter((m) => m.active);
  const inactive = team.members.filter((m) => !m.active);

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Equipe"
        subtitle="Quem acessa o painel do restaurante e o que cada um pode fazer."
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <PlusIcon size={18} /> Convidar pessoa
          </Button>
        }
      />

      <section>
        <GroupLabel>Com acesso ({active.length})</GroupLabel>
        <Card padding="none" className="divide-y divide-stone-100">
          {active.map((m) => (
            <MemberRow key={m.id} member={m} actions={m.is_me ? null : actionsFor(m)} busy={busy} />
          ))}
        </Card>
      </section>

      {team.invites.length > 0 && (
        <section>
          <GroupLabel>Convites pendentes ({team.invites.length})</GroupLabel>
          <Card padding="none" className="divide-y divide-stone-100">
            {team.invites.map((i) => (
              <div key={i.email} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                  <MailIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{i.full_name || i.email}</p>
                  <p className="truncate text-xs text-stone-500">
                    {i.full_name ? `${i.email} · ` : ""}
                    {ROLE_LABEL[i.role]} · aguardando a pessoa criar a conta
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => revoke(i.email)}>
                  Cancelar
                </Button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {inactive.length > 0 && (
        <section>
          <GroupLabel>Acesso desativado ({inactive.length})</GroupLabel>
          <Card padding="none" className="divide-y divide-stone-100">
            {inactive.map((m) => (
              <MemberRow key={m.id} member={m} actions={actionsFor(m)} busy={busy} />
            ))}
          </Card>
        </section>
      )}

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={async (message) => {
          setInviteOpen(false);
          await reload();
          show(message);
        }}
      />

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={
          confirm?.action === "remove"
            ? `Remover ${confirm.member.full_name || confirm.member.email} da equipe?`
            : `Desativar o acesso de ${confirm?.member.full_name || confirm?.member.email}?`
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Voltar
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                if (!confirm) return;
                const m = confirm.member;
                const name = m.full_name || m.email;
                if (confirm.action === "remove") setStaff(m, "client", true, `${name} saiu da equipe.`);
                else setStaff(m, m.role as StaffRole, false, `Acesso de ${name} desativado.`);
              }}
            >
              {confirm?.action === "remove" ? "Remover" : "Desativar"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600">
          {confirm?.action === "remove"
            ? "A conta continua existindo como conta de cliente (pode reservar pelo site), mas perde o acesso ao painel."
            : "A pessoa deixa de entrar no painel na hora. Dá para reativar depois, sem novo convite."}
        </p>
      </Modal>

      <Toast toast={toast} onClose={clear} />
    </div>
  );
}

function MemberRow({ member: m, actions, busy }: { member: Member; actions: ActionItem[] | null; busy: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${m.active ? "" : "opacity-70"}`}>
      <Avatar name={m.full_name || m.email} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-semibold text-stone-900">{m.full_name || m.email}</span>
          <Badge tone={m.role === "manager" ? "brand" : "neutral"}>{ROLE_LABEL[m.role]}</Badge>
          {m.is_me && <Badge tone="confirmed">Você</Badge>}
        </p>
        <p className="truncate text-xs text-stone-500">
          {m.full_name ? `${m.email} · ` : ""}
          {lastAccess(m.last_sign_in_at)}
        </p>
      </div>
      {actions && <ActionsMenu items={actions} label={`Ações para ${m.full_name || m.email}`} disabled={busy} />}
    </div>
  );
}

function InviteDialog({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: (message: string) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Convidar para a equipe" description="A pessoa entra no painel com o papel escolhido.">
      {open && <InviteForm onCancel={onClose} onInvited={onInvited} />}
    </Modal>
  );
}

function InviteForm({ onCancel, onInvited }: { onCancel: () => void; onInvited: (message: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("host");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const signupUrl = typeof window !== "undefined" ? `${window.location.origin}/cadastro` : "/cadastro";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setError("Informe um e-mail válido.");
    setSaving(true);
    setError(null);
    const { data, error: e2 } = await createClient().rpc("invite_staff", {
      p_email: clean,
      p_role: role,
      p_full_name: name.trim() || null,
    });
    setSaving(false);
    if (e2) return setError(friendlyErrorMessage(e2));
    if (data === "promoted") {
      onInvited(`${name.trim() || clean} já tinha conta e agora é ${ROLE_LABEL[role].toLowerCase()}.`);
      return;
    }
    setSent(clean);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-sm text-stone-700">
        <p>
          Convite registrado para <strong className="font-semibold">{sent}</strong>. Agora peça para a pessoa criar a conta
          com esse e-mail no endereço abaixo. Assim que ela confirmar o e-mail, entra como {ROLE_LABEL[role].toLowerCase()}.
        </p>
        <div className="flex items-center gap-2 rounded-control border border-stone-200 bg-stone-50 px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-sm">{signupUrl}</code>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigator.clipboard?.writeText(signupUrl).catch(() => undefined)}
          >
            Copiar
          </Button>
        </div>
        <p className="text-xs text-stone-500">O papel nunca vem do cadastro: só quem foi convidado aqui recebe acesso ao painel.</p>
        <div className="flex justify-end">
          <Button onClick={() => onInvited("Convite registrado.")}>Pronto</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Input id="i-name" label="Nome (opcional)" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      <Input
        id="i-email"
        label="E-mail"
        type="email"
        autoComplete="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 px-1 text-sm font-medium text-stone-600">Papel</legend>
        {(["host", "manager"] as StaffRole[]).map((r) => (
          <label
            key={r}
            className={`flex cursor-pointer items-start gap-3 rounded-control border px-4 py-3 transition-colors ${
              role === r ? "border-brand bg-brand-soft" : "border-stone-200 bg-white hover:bg-stone-50"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={r}
              checked={role === r}
              onChange={() => setRole(r)}
              className="mt-0.5 h-5 w-5 accent-[rgb(var(--c-brand))]"
            />
            <span>
              <span className="block text-sm font-semibold text-stone-900">{ROLE_LABEL[r]}</span>
              <span className="block text-xs text-stone-600">{ROLE_HINT[r]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Enviando..." : "Convidar"}
        </Button>
      </div>
    </form>
  );
}
