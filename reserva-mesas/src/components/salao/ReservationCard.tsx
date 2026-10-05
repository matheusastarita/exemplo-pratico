"use client";

import { Badge } from "@/components/ui/Badge";
import { ActionsMenu, type ActionItem } from "@/components/ui/ActionsMenu";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  GiftIcon,
  PeopleIcon,
  ReceiptIcon,
  StarIcon,
  TableIcon,
  UndoIcon,
} from "@/components/icons";
import { OCCASION_LABEL, SOURCE_LABEL, STATUS_LABEL } from "@/lib/constants";
import { formatDuration, telHref } from "@/lib/format";
import {
  allergyText,
  hasAllergy,
  isBirthday,
  isVip,
  minutesFromNow,
  minutesSeated,
  type DisplayStatus,
} from "@/lib/salao";
import type { HostReservation } from "@/lib/types";

export type CardActions = {
  onSeat: (r: HostReservation) => void;
  onStatus: (r: HostReservation, status: "no_show" | "cancelled" | "completed" | "confirmed" | "seated") => void;
  onToggleCheck: (r: HostReservation) => void;
  onMoveTable: (r: HostReservation) => void;
  onMessage: (r: HostReservation) => void;
  onOpen: (r: HostReservation) => void;
};

const DISPLAY_LABEL: Record<DisplayStatus, string> = { ...STATUS_LABEL, late: "Atrasada" };

function timeHint(r: HostReservation, status: DisplayStatus, now: number): string | null {
  if (status === "seated") {
    const mins = minutesSeated(r, now);
    if (mins === null) return null;
    const left = r.duration_minutes - mins;
    return left >= 0
      ? `Na mesa há ${formatDuration(mins)} · faltam ${formatDuration(left)}`
      : `Na mesa há ${formatDuration(mins)} · passou ${formatDuration(-left)} do previsto`;
  }
  if (status === "late") return `Atrasada ${formatDuration(-minutesFromNow(r.date, r.start_time, now))}`;
  if (status === "confirmed" || status === "pending") {
    const mins = minutesFromNow(r.date, r.start_time, now);
    if (mins >= 0 && mins <= 120) return mins <= 1 ? "Chegando agora" : `Em ${formatDuration(mins)}`;
    if (mins < 0) return "No horário";
  }
  return null;
}

export function ReservationCard({
  r,
  status,
  tablesLabel,
  now,
  busy,
  actions,
  draggable = false,
}: {
  r: HostReservation;
  status: DisplayStatus;
  tablesLabel: string;
  now: number;
  busy: boolean;
  actions: CardActions;
  draggable?: boolean;
}) {
  const hint = timeHint(r, status, now);
  const soon =
    (status === "confirmed" || status === "pending") &&
    minutesFromNow(r.date, r.start_time, now) <= 30;
  const ended = status === "completed" || status === "no_show" || status === "cancelled";

  const menu: ActionItem[] = [];
  if (status !== "completed" && !ended) {
    menu.push({ label: "Trocar mesa", onSelect: () => actions.onMoveTable(r) });
  }
  if (r.customer.phone) menu.push({ label: "Ligar", href: telHref(r.customer.phone) });
  if (r.customer.phone) menu.push({ label: "Enviar mensagem", onSelect: () => actions.onMessage(r) });
  menu.push({ label: "Ver detalhes e histórico", onSelect: () => actions.onOpen(r) });
  if (status === "seated") menu.push({ label: "Desfazer: voltar para confirmada", onSelect: () => actions.onStatus(r, "confirmed") });
  if (!ended && status !== "seated") {
    menu.push({ label: "Cancelar reserva", tone: "danger", onSelect: () => actions.onStatus(r, "cancelled") });
  }

  return (
    <article
      draggable={draggable && !ended}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/reservation", r.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      aria-label={`${r.start_time}, ${r.customer.full_name}, ${r.party_size} pessoas, ${DISPLAY_LABEL[status]}`}
      className={`rounded-card border bg-white p-3.5 shadow-card transition-shadow sm:p-4 ${
        status === "late"
          ? "border-status-late/40 ring-1 ring-status-late/20"
          : soon
            ? "border-brand/40"
            : "border-stone-200/80"
      } ${ended ? "opacity-70" : ""} ${draggable && !ended ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 shrink-0 text-center">
          <p className="text-[17px] font-bold tabular-nums leading-tight text-stone-900">{r.start_time}</p>
          <p className="mt-0.5 flex items-center justify-center gap-0.5 text-xs text-stone-500">
            <PeopleIcon size={13} /> {r.party_size}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => actions.onOpen(r)}
              className="min-w-0 text-left"
            >
              <p className="truncate font-semibold text-stone-900 hover:underline">{r.customer.full_name}</p>
            </button>
            <Badge tone={status}>{DISPLAY_LABEL[status]}</Badge>
          </div>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-stone-600">
            <span className="flex items-center gap-1">
              <TableIcon size={14} /> {tablesLabel ? `Mesa ${tablesLabel}` : "Sem mesa"}
            </span>
            <span aria-hidden="true">·</span>
            <span>{SOURCE_LABEL[r.source]}</span>
            {r.occasion && (
              <>
                <span aria-hidden="true">·</span>
                <span>{OCCASION_LABEL[r.occasion]}</span>
              </>
            )}
          </p>

          {(isVip(r) || isBirthday(r) || r.customer.no_shows > 0 || r.customer.visits >= 4 || r.check_requested_at) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {isVip(r) && (
                <Badge tone="brand" icon={<StarIcon size={12} />}>
                  VIP
                </Badge>
              )}
              {isBirthday(r) && (
                <Badge tone="warning" icon={<GiftIcon size={12} />}>
                  Aniversário
                </Badge>
              )}
              {r.customer.visits >= 4 && <Badge tone="neutral">{r.customer.visits} visitas</Badge>}
              {r.customer.no_shows > 0 && (
                <Badge tone="no_show">
                  {r.customer.no_shows} {r.customer.no_shows === 1 ? "falta" : "faltas"}
                </Badge>
              )}
              {r.check_requested_at && status === "seated" && (
                <Badge tone="warning" icon={<ReceiptIcon size={12} />}>
                  Pediu a conta
                </Badge>
              )}
            </div>
          )}

          {hasAllergy(r) && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-700">
              <AlertIcon size={16} className="mt-0.5 shrink-0" />
              <span>Alergia/restrição: {allergyText(r)}</span>
            </p>
          )}
          {(r.notes || r.internal_notes) && (
            <p className="mt-1.5 line-clamp-2 text-sm text-stone-600">
              {r.internal_notes ? <span className="font-medium text-stone-700">Equipe: {r.internal_notes} </span> : null}
              {r.notes ? `“${r.notes}”` : null}
            </p>
          )}
          {hint && (
            <p
              className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
                status === "late" ? "text-status-late" : soon ? "text-brand-ink" : "text-stone-500"
              }`}
            >
              <ClockIcon size={13} /> {hint}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3">
        {(status === "confirmed" || status === "pending" || status === "late") && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => actions.onSeat(r)}
              className="flex min-h-tap flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-3 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              <CheckIcon size={16} /> Chegou — sentar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => actions.onStatus(r, "no_show")}
              className="min-h-tap rounded-full border border-stone-200 bg-white px-3.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              Faltou
            </button>
          </>
        )}
        {status === "seated" && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => actions.onStatus(r, "completed")}
              className="flex min-h-tap flex-1 items-center justify-center gap-1.5 rounded-full bg-stone-900 px-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-60"
            >
              Liberar mesa
            </button>
            <button
              type="button"
              disabled={busy}
              aria-pressed={Boolean(r.check_requested_at)}
              onClick={() => actions.onToggleCheck(r)}
              className={`flex min-h-tap items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium disabled:opacity-60 ${
                r.check_requested_at
                  ? "border-amber-100 bg-amber-50 text-amber-800"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <ReceiptIcon size={16} /> Conta
            </button>
          </>
        )}
        {ended && (
          <button
            type="button"
            disabled={busy}
            onClick={() => actions.onStatus(r, status === "completed" ? "seated" : "confirmed")}
            className="flex min-h-tap items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            <UndoIcon size={16} /> Desfazer
          </button>
        )}
        <div className="ml-auto">
          <ActionsMenu items={menu} label={`Mais ações para ${r.customer.full_name}`} />
        </div>
      </div>
    </article>
  );
}
