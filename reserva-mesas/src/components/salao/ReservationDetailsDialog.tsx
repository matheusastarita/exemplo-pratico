"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhatsAppPreview } from "@/components/WhatsAppPreview";
import { formatDateFull } from "@/lib/dates";
import { formatBRL, formatPhone, peopleLabel, telHref } from "@/lib/format";
import { friendlyErrorMessage, OCCASION_LABEL, OCCASION_OPTIONS, SOURCE_LABEL, STATUS_LABEL, STAFF_ERROR_MESSAGES } from "@/lib/constants";
import type { HostReservation, Occasion, ReservationHistory, ReservationStatus } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  confirmacao: "Confirmação",
  lembrete_24h: "Lembrete (24h)",
  lembrete_2h: "Lembrete (2h)",
  alteracao: "Alteração",
  cancelamento: "Cancelamento",
  lista_espera: "Lista de espera",
  manual: "Mensagem da equipe",
};

function eventText(e: ReservationHistory["events"][number]): string {
  const d = (e.details ?? {}) as Record<string, string | number | boolean>;
  if (e.action === "created") return `Reserva criada (${SOURCE_LABEL[d.source as keyof typeof SOURCE_LABEL] ?? "—"})`;
  if (e.action === "tables") return d.tables ? `Mesa definida: ${d.tables}` : "Mesas liberadas";
  const parts: string[] = [];
  if (d.status_to) {
    parts.push(
      `${STATUS_LABEL[d.status_from as ReservationStatus] ?? d.status_from} → ${STATUS_LABEL[d.status_to as ReservationStatus] ?? d.status_to}`
    );
  }
  if (d.reason) parts.push(`motivo: ${d.reason}`);
  if (d.from) parts.push(`horário ${d.from} → ${d.to}`);
  if (d.party_to) parts.push(`pessoas ${d.party_from} → ${d.party_to}`);
  if (d.notes_changed) parts.push("observações editadas");
  if (d.customer_confirmed) parts.push("cliente confirmou presença");
  if (d.deposit_to) parts.push(`sinal: ${d.deposit_to === "paid" ? "pago" : d.deposit_to}`);
  if (d.check_requested) parts.push("pediu a conta");
  return parts.join(" · ") || "Atualização";
}

function when(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Ficha da reserva: dados, edição rápida e histórico (mudanças + mensagens). */
export function ReservationDetailsDialog({
  reservation,
  tablesLabel,
  restaurant,
  onClose,
  onSaved,
}: {
  reservation: HostReservation | null;
  tablesLabel: string;
  restaurant: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [history, setHistory] = useState<{ id: string; data: ReservationHistory | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const r = reservation;

  useEffect(() => {
    if (!r) return;
    let cancelled = false;
    supabase.rpc("reservation_history", { p_id: r.id }).then(({ data }) => {
      if (!cancelled) setHistory({ id: r.id, data: data ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [r, supabase]);

  if (!r) return null;
  const loadingHistory = history?.id !== r.id;
  const editable = r.status === "pending" || r.status === "confirmed" || r.status === "seated";

  return (
    <Modal open onClose={() => { setEditing(false); onClose(); }} title={r.customer.full_name} description={`Reserva ${r.code}`} size="lg">
      {editing ? (
        <EditReservationForm
          reservation={r}
          onCancel={() => setEditing(false)}
          onSaved={(msg) => {
            setEditing(false);
            onSaved(msg);
          }}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={r.status} size="md">
              {STATUS_LABEL[r.status]}
            </Badge>
            {r.customer.tags.map((t) => (
              <Badge key={t} tone="brand">
                {t}
              </Badge>
            ))}
            {r.customer.blocked && <Badge tone="no_show">Bloqueado online</Badge>}
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Quando</dt>
              <dd className="font-medium text-stone-900">
                {formatDateFull(r.date)}, {r.start_time}–{r.end_time}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Grupo e mesa</dt>
              <dd className="font-medium text-stone-900">
                {peopleLabel(r.party_size)} · {tablesLabel ? `mesa ${tablesLabel}` : "sem mesa"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Contato</dt>
              <dd className="font-medium text-stone-900">
                {r.customer.phone ? (
                  <a href={telHref(r.customer.phone)} className="text-brand-ink hover:underline">
                    {formatPhone(r.customer.phone)}
                  </a>
                ) : (
                  "Sem telefone"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Origem e ocasião</dt>
              <dd className="font-medium text-stone-900">
                {SOURCE_LABEL[r.source]}
                {r.occasion ? ` · ${OCCASION_LABEL[r.occasion]}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Histórico do cliente</dt>
              <dd className="font-medium text-stone-900">
                {r.customer.visits} {r.customer.visits === 1 ? "visita" : "visitas"} · {r.customer.no_shows}{" "}
                {r.customer.no_shows === 1 ? "falta" : "faltas"}
              </dd>
            </div>
            {r.deposit_status !== "none" && (
              <div>
                <dt className="text-stone-500">Sinal</dt>
                <dd className="font-medium text-stone-900">
                  {formatBRL(Number(r.deposit_amount ?? 0))} ·{" "}
                  {{ pending: "aguardando", paid: "pago", refunded: "devolvido", forfeited: "retido", none: "" }[r.deposit_status]}
                </dd>
              </div>
            )}
          </dl>

          {(r.dietary_notes || r.customer.allergies) && (
            <p className="rounded-control bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              Alergia/restrição: {[r.dietary_notes, r.customer.allergies].filter(Boolean).join(" · ")}
            </p>
          )}
          {r.notes && (
            <p className="text-sm text-stone-700">
              <span className="font-medium">Pedido do cliente:</span> {r.notes}
            </p>
          )}
          {r.internal_notes && (
            <p className="text-sm text-stone-700">
              <span className="font-medium">Observação interna:</span> {r.internal_notes}
            </p>
          )}
          {r.customer.notes && (
            <p className="text-sm text-stone-700">
              <span className="font-medium">Sobre o cliente:</span> {r.customer.notes}
            </p>
          )}

          {editable && (
            <Button variant="secondary" className="self-start" onClick={() => setEditing(true)}>
              Editar reserva
            </Button>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-stone-900">Histórico</h3>
            {loadingHistory ? (
              <div className="flex flex-col gap-2" role="status" aria-label="Carregando histórico">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <ol className="flex flex-col gap-2 border-l-2 border-stone-200 pl-4 text-sm">
                {(history?.data?.events ?? []).map((e, i) => (
                  <li key={i} className="text-stone-700">
                    <span className="text-xs text-stone-500">{when(e.created_at)}</span> · {eventText(e)}
                    {e.actor_name ? <span className="text-stone-500"> — {e.actor_name}</span> : null}
                  </li>
                ))}
                {(history?.data?.events ?? []).length === 0 && <li className="text-stone-500">Sem mudanças registradas.</li>}
              </ol>
            )}
          </section>

          {(history?.data?.messages ?? []).length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-stone-900">Mensagens enviadas</h3>
              <div className="flex flex-col gap-3">
                {(history?.data?.messages ?? []).map((m, i) => (
                  <div key={i}>
                    <p className="mb-1 text-xs text-stone-500">
                      {KIND_LABEL[m.kind] ?? m.kind} · {when(m.created_at)}
                    </p>
                    <WhatsAppPreview body={m.body} sender={restaurant} simulated={m.simulated} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Edição de uma reserva pela equipe (também usada na gerência). */
export function EditReservationForm({
  reservation: r,
  onCancel,
  onSaved,
}: {
  reservation: Pick<
    HostReservation,
    "id" | "date" | "start_time" | "party_size" | "occasion" | "notes" | "internal_notes" | "dietary_notes"
  >;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [date, setDate] = useState(r.date);
  const [time, setTime] = useState(r.start_time);
  const [party, setParty] = useState(r.party_size);
  const [occasion, setOccasion] = useState<Occasion | "">(r.occasion ?? "");
  const [notes, setNotes] = useState(r.notes ?? "");
  const [internal, setInternal] = useState(r.internal_notes ?? "");
  const [dietary, setDietary] = useState(r.dietary_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc("update_reservation_staff", {
      p_id: r.id,
      p_date: date,
      p_start_time: time,
      p_party_size: party,
      p_occasion: occasion || null,
      p_notes: notes,
      p_internal_notes: internal,
      p_dietary_notes: dietary,
    });
    setSaving(false);
    if (rpcError) return setError(friendlyErrorMessage(rpcError, STAFF_ERROR_MESSAGES));
    onSaved("Reserva atualizada.");
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input id="er-date" type="date" label="Data" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input id="er-time" type="time" label="Horário" value={time} onChange={(e) => setTime(e.target.value)} required />
        <Input
          id="er-party"
          type="number"
          label="Pessoas"
          min={1}
          max={60}
          value={party}
          onChange={(e) => setParty(Math.max(1, Number(e.target.value) || 1))}
          required
        />
      </div>
      <Select id="er-occasion" label="Ocasião" value={occasion} onChange={(e) => setOccasion(e.target.value as Occasion | "")}>
        <option value="">Nenhuma</option>
        {OCCASION_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </Select>
      <Input id="er-dietary" label="Alergias / restrições" value={dietary} onChange={(e) => setDietary(e.target.value)} />
      <Textarea id="er-notes" label="Pedido do cliente" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Textarea id="er-internal" label="Observação interna" rows={2} value={internal} onChange={(e) => setInternal(e.target.value)} />
      <p className="text-xs text-stone-500">
        Se mudar data, horário ou pessoas, o sistema tenta manter a mesa — e escolhe outra se precisar.
      </p>
      {error && <p role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Voltar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
