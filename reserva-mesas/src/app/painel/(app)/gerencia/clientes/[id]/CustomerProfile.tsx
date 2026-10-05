"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { Toast, type ToastData } from "@/components/ui/Toast";
import { WhatsAppPreview } from "@/components/WhatsAppPreview";
import { MESSAGE_KIND_LABEL, ReservationHistoryView, formatWhen } from "@/components/reservas/ReservationHistory";
import { AlertIcon, BanIcon, ChevronIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { dayMonthLabel, formatWeekdayDateShort, monthShortLabel } from "@/lib/dates";
import { formatPhone, maskPhoneInput, normalizePhoneBR, peopleLabel, telHref, whatsappHref } from "@/lib/format";
import { CUSTOMER_TAGS, OCCASION_LABEL, SOURCE_LABEL, STATUS_LABEL, friendlyErrorMessage } from "@/lib/constants";
import type { CustomerDetail } from "@/lib/types";

type Reservation = CustomerDetail["reservations"][number];

const ACTIVE = new Set(["pending", "confirmed", "seated"]);
const PAST_PAGE = 10;
const MESSAGES_PAGE = 3;

function memberSince(createdAt: string): string {
  // "Setembro 2026" -> "setembro de 2026"
  const label = monthShortLabel(createdAt.slice(0, 10)).replace(" ", " de ");
  return label.charAt(0).toLowerCase() + label.slice(1);
}

function saveErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === "23505") return "Esse telefone já está no cadastro de outro cliente.";
  if (error.code === "23514") return "Telefone inválido. Use DDD + número, ex.: (11) 98888-7777.";
  return friendlyErrorMessage(error);
}

export function CustomerProfile({ detail, today, restaurant }: { detail: CustomerDetail; today: string; restaurant: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const supabase = useMemo(() => createClient(), []);
  const c = detail.customer;
  const anonymized = c.anonymized_at !== null;

  const [toast, setToast] = useState<ToastData | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [anonymizeOpen, setAnonymizeOpen] = useState(false);
  const [anonymizeConfirmed, setAnonymizeConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<Reservation | null>(null);
  const [showAllPast, setShowAllPast] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);

  const { upcoming, past, stats } = useMemo(() => {
    const list = detail.reservations;
    // A lista vem do mais recente para o mais antigo; as próximas ficam em ordem de chegada.
    const upcomingList = list.filter((r) => r.date >= today && ACTIVE.has(r.status)).reverse();
    const pastList = list.filter((r) => !(r.date >= today && ACTIVE.has(r.status)));
    const completed = list.filter((r) => r.status === "completed");
    return {
      upcoming: upcomingList,
      past: pastList,
      stats: {
        visits: completed.length,
        people: completed.reduce((s, r) => s + r.party_size, 0),
        noShows: list.filter((r) => r.status === "no_show").length,
        cancellations: list.filter((r) => r.status === "cancelled").length,
      },
    };
  }, [detail.reservations, today]);

  function refresh(message: string) {
    setToast({ id: Date.now(), message, tone: "success" });
    startTransition(() => router.refresh());
  }

  async function setBlocked(blocked: boolean) {
    setBusy(true);
    setDialogError(null);
    const { error } = await supabase.rpc("block_customer", {
      p_id: c.id,
      p_blocked: blocked,
      p_reason: blocked ? blockReason.trim() : null,
    });
    setBusy(false);
    if (error) {
      if (blocked) setDialogError(friendlyErrorMessage(error));
      else setToast({ id: Date.now(), message: friendlyErrorMessage(error), tone: "error" });
      return;
    }
    setBlockOpen(false);
    setBlockReason("");
    refresh(blocked ? "Cliente bloqueado para reservas pelo site." : "Cliente desbloqueado.");
  }

  async function anonymize() {
    setBusy(true);
    setDialogError(null);
    const { error } = await supabase.rpc("anonymize_customer", { p_id: c.id });
    setBusy(false);
    if (error) {
      setDialogError(friendlyErrorMessage(error));
      return;
    }
    setAnonymizeOpen(false);
    router.push("/painel/gerencia/clientes");
    router.refresh();
  }

  const visiblePast = showAllPast ? past : past.slice(0, PAST_PAGE);
  const visibleMessages = showAllMessages ? detail.messages : detail.messages.slice(0, MESSAGES_PAGE);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/painel/gerencia/clientes"
        className="inline-flex min-h-tap w-fit items-center gap-1 rounded-full pr-3 text-sm font-medium text-stone-600 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <ChevronIcon direction="left" size={18} /> Clientes
      </Link>

      {/* Cabeçalho da ficha */}
      <Card className="flex items-start gap-4">
        <Avatar name={c.full_name} size="md" className="sm:hidden" />
        <Avatar name={c.full_name} size="lg" className="hidden sm:flex" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">{c.full_name}</h1>
            {c.tags.map((t) => (
              <Badge key={t} tone={t === "VIP" ? "brand" : "neutral"}>
                {t}
              </Badge>
            ))}
            {c.blocked && (
              <Badge tone="no_show" icon={<BanIcon size={12} />}>
                Bloqueado
              </Badge>
            )}
          </div>
          {!anonymized && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {c.phone ? (
                <>
                  <a href={telHref(c.phone)} className="inline-flex min-h-9 items-center gap-1.5 text-brand-ink hover:underline">
                    <PhoneIcon size={16} /> {formatPhone(c.phone)}
                  </a>
                  <a
                    href={whatsappHref(c.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 text-brand-ink hover:underline"
                  >
                    <WhatsAppIcon size={16} /> WhatsApp
                  </a>
                </>
              ) : (
                <span className="text-stone-500">Sem telefone</span>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="inline-flex min-h-9 items-center gap-1.5 text-brand-ink hover:underline">
                  <MailIcon size={16} /> {c.email}
                </a>
              )}
            </div>
          )}
          <p className="mt-1 text-sm text-stone-500">
            Cliente desde {memberSince(c.created_at)}
            {c.user_id && " · tem conta no site"}
            {c.birthday && ` · aniversário em ${dayMonthLabel(c.birthday)}`}
            {` · ${c.marketing_consent ? "aceita" : "não aceita"} receber novidades`}
          </p>
        </div>
        {!anonymized && (
          <div className="shrink-0">
            <ActionsMenu
              label={`Mais ações para ${c.full_name}`}
              items={[
                c.blocked
                  ? { label: "Desbloquear cliente", onSelect: () => setBlocked(false) }
                  : {
                      label: "Bloquear cliente",
                      onSelect: () => {
                        setDialogError(null);
                        setBlockOpen(true);
                      },
                    },
                {
                  label: "Anonimizar dados (LGPD)",
                  tone: "danger",
                  onSelect: () => {
                    setDialogError(null);
                    setAnonymizeConfirmed(false);
                    setAnonymizeOpen(true);
                  },
                },
              ]}
            />
          </div>
        )}
      </Card>

      {anonymized && (
        <div role="status" className="rounded-card border border-stone-200 bg-stone-100 px-4 py-3 text-sm text-stone-700">
          Os dados pessoais deste cliente foram anonimizados. As reservas continuam nos relatórios, sem identificação.
        </div>
      )}

      {c.blocked && !anonymized && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 sm:flex-row sm:items-center"
        >
          <AlertIcon size={20} className="shrink-0 text-red-700" />
          <p className="min-w-0 flex-1">
            <strong className="font-semibold">Bloqueado para reservas pelo site.</strong>{" "}
            {c.blocked_reason ? `Motivo: ${c.blocked_reason}. ` : ""}A equipe ainda consegue reservar por telefone.
          </p>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => setBlocked(false)}>
            Desbloquear
          </Button>
        </div>
      )}

      {/* Números do cliente (contados das reservas dele) */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Visitas", value: stats.visits },
          { label: "Pessoas trazidas", value: stats.people },
          { label: "Faltas", value: stats.noShows, alert: stats.noShows > 0 },
          { label: "Cancelamentos", value: stats.cancellations },
        ].map((s) => (
          <Card key={s.label} padding="sm" className="flex flex-col-reverse gap-1">
            <dt className="text-sm text-stone-500">{s.label}</dt>
            <dd className={`text-2xl font-semibold ${s.alert ? "text-status-no-show" : "text-stone-900"}`}>{s.value}</dd>
          </Card>
        ))}
      </dl>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        {/* No celular o histórico vem antes do formulário; no desktop o formulário fica à esquerda */}
        <div className="order-last lg:order-none">
          <CustomerForm key={c.id} customer={c} disabled={anonymized} onSaved={() => refresh("Ficha atualizada.")} />
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="text-base font-semibold text-stone-900">Reservas</h2>
            {detail.reservations.length === 0 && <p className="mt-3 text-sm text-stone-500">Nenhuma reserva ainda.</p>}

            {upcoming.length > 0 && (
              <section className="mt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Próximas</h3>
                <ul className="divide-y divide-stone-100">
                  {upcoming.map((r) => (
                    <ReservationItem key={r.id} r={r} onHistory={() => setHistoryFor(r)} />
                  ))}
                </ul>
              </section>
            )}

            {past.length > 0 && (
              <section className="mt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Anteriores</h3>
                <ul className="divide-y divide-stone-100">
                  {visiblePast.map((r) => (
                    <ReservationItem key={r.id} r={r} onHistory={() => setHistoryFor(r)} />
                  ))}
                </ul>
                {past.length > PAST_PAGE && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAllPast((v) => !v)}>
                    {showAllPast ? "Mostrar menos" : `Ver todas (${past.length})`}
                  </Button>
                )}
              </section>
            )}
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-stone-900">Mensagens enviadas</h2>
            <p className="mt-0.5 text-sm text-stone-500">Simuladas na demonstração: nada é enviado de verdade.</p>
            {detail.messages.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">Nenhuma mensagem para este cliente.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                {visibleMessages.map((m, i) => (
                  <div key={i}>
                    <p className="mb-1 text-xs text-stone-500">
                      {MESSAGE_KIND_LABEL[m.kind] ?? m.kind} · {formatWhen(m.created_at)}
                    </p>
                    <WhatsAppPreview body={m.body} sender={restaurant} simulated={m.simulated} />
                  </div>
                ))}
                {detail.messages.length > MESSAGES_PAGE && (
                  <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAllMessages((v) => !v)}>
                    {showAllMessages ? "Mostrar menos" : `Ver todas (${detail.messages.length})`}
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={historyFor !== null}
        onClose={() => setHistoryFor(null)}
        title={historyFor ? `${formatWeekdayDateShort(historyFor.date)} · ${historyFor.start_time}` : ""}
        description={historyFor ? `${peopleLabel(historyFor.party_size)} · código ${historyFor.code}` : undefined}
        size="lg"
      >
        {historyFor && <ReservationHistoryView reservationId={historyFor.id} restaurant={restaurant} />}
      </Modal>

      <Modal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title="Bloquear cliente?"
        description={c.full_name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBlockOpen(false)}>
              Voltar
            </Button>
            <Button variant="danger" disabled={busy || blockReason.trim().length < 3} onClick={() => setBlocked(true)}>
              Bloquear
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-stone-600">
            Clientes bloqueados não conseguem reservar nem entrar na lista de espera pelo site. A equipe ainda pode
            reservar por telefone.
          </p>
          <Textarea
            id="block-reason"
            label="Motivo"
            hint="Fica registrado no histórico. Ex.: faltou 3 vezes sem avisar."
            value={blockReason}
            maxLength={200}
            onChange={(e) => setBlockReason(e.target.value)}
            error={dialogError ?? undefined}
          />
        </div>
      </Modal>

      <Modal
        open={anonymizeOpen}
        onClose={() => setAnonymizeOpen(false)}
        title="Anonimizar dados do cliente?"
        description={c.full_name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAnonymizeOpen(false)}>
              Voltar
            </Button>
            <Button variant="danger" disabled={busy || !anonymizeConfirmed} onClick={anonymize}>
              Anonimizar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-sm text-stone-600">
          <p>
            Para atender um pedido de exclusão (LGPD): apaga nome, telefone, e-mail, aniversário, alergias, observações e as
            mensagens enviadas. As reservas continuam nos relatórios, sem identificar a pessoa.
          </p>
          <Checkbox
            id="anonymize-confirm"
            checked={anonymizeConfirmed}
            onChange={(e) => setAnonymizeConfirmed(e.target.checked)}
            label="Entendo que isso não pode ser desfeito."
          />
          {dialogError && (
            <p role="alert" className="text-sm text-red-600">
              {dialogError}
            </p>
          )}
        </div>
      </Modal>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function ReservationItem({ r, onHistory }: { r: Reservation; onHistory: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onHistory}
        aria-label={`${formatWeekdayDateShort(r.date)} às ${r.start_time}, ${STATUS_LABEL[r.status]}. Ver histórico`}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-control px-2 py-3 text-left transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-900">
            {formatWeekdayDateShort(r.date)} · <span className="tabular-nums">{r.start_time}</span>
          </p>
          <p className="text-xs text-stone-500">
            {peopleLabel(r.party_size)} · Mesa {r.tables ?? "—"} · {SOURCE_LABEL[r.source]}
            {r.occasion && ` · ${OCCASION_LABEL[r.occasion]}`}
          </p>
          {r.dietary_notes && <p className="mt-0.5 text-xs font-medium text-red-700">Alergia: {r.dietary_notes}</p>}
          {r.status === "cancelled" && r.cancel_reason && (
            <p className="mt-0.5 text-xs text-stone-500">Motivo: {r.cancel_reason}</p>
          )}
        </div>
        <Badge tone={r.status}>{STATUS_LABEL[r.status]}</Badge>
        <ChevronIcon direction="right" size={16} className="shrink-0 text-stone-400" />
      </button>
    </li>
  );
}

function CustomerForm({
  customer: c,
  disabled,
  onSaved,
}: {
  customer: CustomerDetail["customer"];
  disabled: boolean;
  onSaved: () => void;
}) {
  const [name, setName] = useState(c.full_name);
  const [phone, setPhone] = useState(c.phone ? maskPhoneInput(c.phone) : "");
  const [email, setEmail] = useState(c.email ?? "");
  const [birthday, setBirthday] = useState(c.birthday ?? "");
  const [allergies, setAllergies] = useState(c.allergies ?? "");
  const [notes, setNotes] = useState(c.notes ?? "");
  const [tags, setTags] = useState<string[]>(c.tags);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; form?: string }>({});
  const [dirty, setDirty] = useState(false);

  const allTags = [...CUSTOMER_TAGS, ...tags.filter((t) => !CUSTOMER_TAGS.includes(t))];

  function change<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  function toggleTag(tag: string) {
    setTags((list) => (list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]));
    setDirty(true);
  }

  function addTag() {
    const tag = newTag.trim().replace(/\s+/g, " ").slice(0, 20);
    if (tag && !tags.includes(tag)) {
      setTags((list) => [...list, tag]);
      setDirty(true);
    }
    setNewTag("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Informe o nome (pelo menos 2 letras).";
    const normalized = phone.trim() ? normalizePhoneBR(phone) : null;
    if (phone.trim() && !normalized) next.phone = "Telefone inválido. Use DDD + número.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "E-mail inválido.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    const { error } = await createClient()
      .from("customers")
      .update({
        full_name: name.trim().replace(/\s+/g, " "),
        phone: normalized,
        email: email.trim().toLowerCase() || null,
        birthday: birthday || null,
        allergies: allergies.trim() || null,
        notes: notes.trim() || null,
        tags,
      })
      .eq("id", c.id);
    setSaving(false);
    if (error) {
      setErrors({ form: saveErrorMessage(error) });
      return;
    }
    setDirty(false);
    onSaved();
  }

  return (
    <Card>
      <form onSubmit={save} className="flex flex-col gap-4" noValidate>
        <div>
          <h2 className="text-base font-semibold text-stone-900">Dados e preferências</h2>
          <p className="mt-0.5 text-sm text-stone-500">Só a equipe vê estas informações.</p>
        </div>
        <fieldset disabled={disabled || saving} className="flex flex-col gap-4">
          <Input id="c-name" label="Nome" value={name} onChange={(e) => change(setName)(e.target.value)} error={errors.name} autoComplete="off" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="c-phone"
              label="Telefone"
              inputMode="tel"
              value={phone}
              onChange={(e) => change(setPhone)(maskPhoneInput(e.target.value))}
              error={errors.phone}
              placeholder="(11) 98888-7777"
            />
            <Input
              id="c-email"
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => change(setEmail)(e.target.value)}
              error={errors.email}
            />
          </div>
          <Input id="c-birthday" label="Aniversário" type="date" value={birthday} onChange={(e) => change(setBirthday)(e.target.value)} />
          <Textarea
            id="c-allergies"
            label="Alergias e restrições"
            hint="Aparece em destaque no salão quando o cliente tem reserva."
            value={allergies}
            maxLength={300}
            onChange={(e) => change(setAllergies)(e.target.value)}
          />
          <Textarea
            id="c-notes"
            label="Observações da equipe"
            hint="Preferências, mesa favorita, como gosta de ser atendido."
            value={notes}
            maxLength={500}
            onChange={(e) => change(setNotes)(e.target.value)}
          />
          <div>
            <p id="c-tags-label" className="px-1 text-sm font-medium text-stone-600">
              Tags
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="c-tags-label">
              {allTags.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleTag(t)}
                    className={`min-h-9 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                      on ? "bg-brand text-brand-contrast" : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                aria-label="Nova tag"
                placeholder="Outra tag"
                value={newTag}
                maxLength={20}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="min-h-9 w-40 rounded-full border border-stone-200 bg-white px-3.5 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              />
              <Button variant="ghost" size="sm" onClick={addTag} disabled={!newTag.trim()}>
                Adicionar
              </Button>
            </div>
          </div>
        </fieldset>
        {errors.form && (
          <p role="alert" className="text-sm text-red-600">
            {errors.form}
          </p>
        )}
        {!disabled && (
          <div className="flex justify-end">
            <Button type="submit" disabled={!dirty || saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
