"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast, useToast } from "@/components/ui/Toast";
import { friendlyErrorMessage } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import type { RestaurantSettingsRow } from "@/lib/types";

type Rules = Pick<
  RestaurantSettingsRow,
  | "slot_step_minutes"
  | "min_notice_minutes"
  | "max_advance_days"
  | "max_party_online"
  | "cancel_deadline_hours"
  | "grace_minutes"
  | "no_show_block_after"
  | "waitlist_enabled"
  | "deposit_enabled"
  | "deposit_min_party"
  | "deposit_per_person"
>;

const STEP_OPTIONS = [10, 15, 20, 30, 60].map((v) => ({ value: v, label: `A cada ${v} minutos` }));
const NOTICE_OPTIONS = [
  { value: 0, label: "Sem antecedência mínima" },
  { value: 30, label: "30 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 180, label: "3 horas antes" },
  { value: 240, label: "4 horas antes" },
  { value: 360, label: "6 horas antes" },
  { value: 720, label: "12 horas antes" },
  { value: 1440, label: "1 dia antes" },
  { value: 2880, label: "2 dias antes" },
];
const DEADLINE_OPTIONS = [
  { value: 0, label: "Até o horário da reserva" },
  ...[1, 2, 3, 4, 6, 12].map((h) => ({ value: h, label: `Até ${h} ${h === 1 ? "hora" : "horas"} antes` })),
  { value: 24, label: "Até 1 dia antes" },
  { value: 48, label: "Até 2 dias antes" },
  { value: 72, label: "Até 3 dias antes" },
];
const GRACE_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60].map((v) => ({
  value: v,
  label: v === 0 ? "Sem tolerância" : `${v} minutos`,
}));

/** Garante que um valor gravado fora da lista (ex.: pelo SQL) continue aparecendo. */
function withCurrent(options: { value: number; label: string }[], current: number, label: (v: number) => string) {
  return options.some((o) => o.value === current) ? options : [...options, { value: current, label: label(current) }];
}

// Só as colunas desta tela: o banco recusa UPDATE em colunas sem permissão (ex.: modo demo).
function pickRules(s: Rules): Rules {
  return {
    slot_step_minutes: s.slot_step_minutes,
    min_notice_minutes: s.min_notice_minutes,
    max_advance_days: s.max_advance_days,
    max_party_online: s.max_party_online,
    cancel_deadline_hours: s.cancel_deadline_hours,
    grace_minutes: s.grace_minutes,
    no_show_block_after: s.no_show_block_after,
    waitlist_enabled: s.waitlist_enabled,
    deposit_enabled: s.deposit_enabled,
    deposit_min_party: s.deposit_min_party,
    deposit_per_person: s.deposit_per_person,
  };
}

export function BookingRulesForm({ initial }: { initial: Rules }) {
  const [rules, setRules] = useState<Rules>(() => pickRules(initial));
  const [advance, setAdvance] = useState(String(initial.max_advance_days));
  const [maxParty, setMaxParty] = useState(String(initial.max_party_online));
  const [blockAfter, setBlockAfter] = useState(String(initial.no_show_block_after));
  const [depositParty, setDepositParty] = useState(initial.deposit_min_party ? String(initial.deposit_min_party) : "");
  const [depositValue, setDepositValue] = useState(initial.deposit_per_person ? String(initial.deposit_per_person) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { toast, show, clear } = useToast();

  function set<K extends keyof Rules>(key: K, value: Rules[K]) {
    setRules((r) => ({ ...r, [key]: value }));
    setDirty(true);
  }
  function text(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setDirty(true);
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const days = Number(advance);
    const party = Number(maxParty);
    const block = Number(blockAfter);
    if (!Number.isInteger(days) || days < 1 || days > 365) next.advance = "Entre 1 e 365 dias.";
    if (!Number.isInteger(party) || party < 1 || party > 50) next.maxParty = "Entre 1 e 50 pessoas.";
    if (!Number.isInteger(block) || block < 1 || block > 20) next.blockAfter = "Entre 1 e 20 faltas.";
    let depositMin: number | null = null;
    let depositPer: number | null = null;
    if (rules.deposit_enabled) {
      depositMin = Number(depositParty);
      depositPer = Number(depositValue.replace(",", "."));
      if (!Number.isInteger(depositMin) || depositMin < 1 || depositMin > 50) next.depositParty = "Informe a partir de quantas pessoas (1 a 50).";
      if (!Number.isFinite(depositPer) || depositPer <= 0) next.depositValue = "Informe o valor por pessoa.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const { error } = await createClient()
      .from("restaurant_settings")
      .update({
        ...rules,
        max_advance_days: days,
        max_party_online: party,
        no_show_block_after: block,
        deposit_min_party: rules.deposit_enabled ? depositMin : rules.deposit_min_party,
        deposit_per_person: rules.deposit_enabled ? Math.round((depositPer ?? 0) * 100) / 100 : rules.deposit_per_person,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      setErrors({ form: friendlyErrorMessage(error) });
      return;
    }
    setDirty(false);
    show("Regras salvas. O site de reservas já segue as novas regras.");
  }

  const depositExample =
    rules.deposit_enabled && Number(depositParty) > 0 && Number(depositValue.replace(",", ".")) > 0
      ? `Ex.: grupo de ${depositParty} paga ${formatBRL(Number(depositParty) * Number(depositValue.replace(",", ".")))} de sinal.`
      : null;

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-stone-900">Reservas pelo site</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            id="r-step"
            label="Horários oferecidos"
            value={rules.slot_step_minutes}
            onChange={(e) => set("slot_step_minutes", Number(e.target.value))}
          >
            {STEP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            id="r-notice"
            label="Antecedência mínima"
            value={rules.min_notice_minutes}
            onChange={(e) => set("min_notice_minutes", Number(e.target.value))}
          >
            {withCurrent(NOTICE_OPTIONS, rules.min_notice_minutes, (v) => `${v} minutos antes`).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            id="r-advance"
            label="Agenda aberta para os próximos (dias)"
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            value={advance}
            onChange={text(setAdvance)}
            error={errors.advance}
          />
          <Input
            id="r-party"
            label="Maior grupo pelo site (pessoas)"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            value={maxParty}
            onChange={text(setMaxParty)}
            error={errors.maxParty}
            hint="Acima disso, o site mostra o botão de falar pelo WhatsApp."
          />
        </div>
        <Checkbox
          id="r-waitlist"
          checked={rules.waitlist_enabled}
          onChange={(e) => set("waitlist_enabled", e.target.checked)}
          label="Lista de espera pelo site"
          hint="Quando o dia lota, o cliente pode entrar na fila e ser avisado se abrir mesa."
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-stone-900">Cancelamento, atrasos e faltas</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            id="r-deadline"
            label="Cliente pode alterar ou cancelar pelo site"
            value={rules.cancel_deadline_hours}
            onChange={(e) => set("cancel_deadline_hours", Number(e.target.value))}
          >
            {withCurrent(DEADLINE_OPTIONS, rules.cancel_deadline_hours, (v) => `Até ${v} horas antes`).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            id="r-grace"
            label="Tolerância de atraso"
            value={rules.grace_minutes}
            onChange={(e) => set("grace_minutes", Number(e.target.value))}
          >
            {withCurrent(GRACE_OPTIONS, rules.grace_minutes, (v) => `${v} minutos`).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            id="r-block"
            label="Bloquear reservas pelo site após (faltas)"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={blockAfter}
            onChange={text(setBlockAfter)}
            error={errors.blockAfter}
            hint="Ao chegar nesse número de faltas, o cliente só reserva falando com a equipe."
          />
        </div>
        <p className="text-sm text-stone-600">
          Passada a tolerância, a reserva aparece como atrasada no salão; o anfitrião decide se marca a falta.
        </p>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-stone-900">Sinal para grupos grandes</h2>
        <Checkbox
          id="r-deposit"
          checked={rules.deposit_enabled}
          onChange={(e) => set("deposit_enabled", e.target.checked)}
          label="Cobrar sinal para garantir a reserva"
          hint="Na demonstração o pagamento é simulado (PIX de mentira); nada é cobrado."
        />
        {rules.deposit_enabled && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              id="r-deposit-party"
              label="A partir de quantas pessoas"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={depositParty}
              onChange={text(setDepositParty)}
              error={errors.depositParty}
            />
            <Input
              id="r-deposit-value"
              label="Valor por pessoa (R$)"
              inputMode="decimal"
              value={depositValue}
              onChange={text(setDepositValue)}
              error={errors.depositValue}
              hint={depositExample ?? undefined}
            />
          </div>
        )}
      </Card>

      {errors.form && (
        <p role="alert" className="text-sm text-red-600">
          {errors.form}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || saving}>
          {saving ? "Salvando..." : "Salvar regras"}
        </Button>
      </div>
      <Toast toast={toast} onClose={clear} />
    </form>
  );
}
