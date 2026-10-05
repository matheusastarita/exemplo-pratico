"use client";

import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { BellIcon, CheckIcon, PeopleIcon, QueueIcon } from "@/components/icons";
import { formatDuration, formatPhone, telHref } from "@/lib/format";
import type { HostWaitlistEntry } from "@/lib/types";

/** Fila de espera do dia: ordem de chegada, tempo esperando, avisar e sentar. */
export function WaitlistPanel({
  entries,
  now,
  busyId,
  onNotify,
  onSeat,
  onRemove,
  onAdd,
}: {
  entries: HostWaitlistEntry[];
  now: number;
  busyId: string | null;
  onNotify: (w: HostWaitlistEntry) => void;
  onSeat: (w: HostWaitlistEntry) => void;
  onRemove: (w: HostWaitlistEntry) => void;
  onAdd: () => void;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        compact
        icon={<QueueIcon size={22} />}
        title="Ninguém na fila"
        message="Quando chegar alguém sem reserva e não houver mesa, coloque na fila por aqui."
        action={
          <button type="button" onClick={onAdd} className="min-h-tap rounded-full bg-brand px-4 text-sm font-semibold text-brand-contrast">
            Chegou sem reserva
          </button>
        }
      />
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((w, i) => {
        const waited = Math.max(0, Math.round((now - new Date(w.created_at).getTime()) / 60000));
        const overdue = w.quoted_wait_minutes !== null && waited > w.quoted_wait_minutes;
        const busy = busyId === w.id;
        return (
          <li key={w.id} className="rounded-card border border-stone-200/80 bg-white p-3.5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-ink">
                {i + 1}º
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-stone-900">{w.customer.full_name}</p>
                  {w.status === "notified" && (
                    <Badge tone="warning" icon={<BellIcon size={12} />}>
                      Avisado
                    </Badge>
                  )}
                  {w.source === "site" && <Badge tone="neutral">Pelo site</Badge>}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-stone-600">
                  <span className="flex items-center gap-1">
                    <PeopleIcon size={14} /> {w.party_size}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className={overdue ? "font-semibold text-status-late" : ""}>
                    esperando há {formatDuration(waited)}
                  </span>
                  {w.quoted_wait_minutes !== null && (
                    <span className="text-stone-500">(previsto {formatDuration(w.quoted_wait_minutes)})</span>
                  )}
                  {w.preferred_from && (
                    <span className="text-stone-500">
                      · prefere {w.preferred_from}–{w.preferred_to}
                    </span>
                  )}
                </p>
                {w.notes && <p className="mt-1 text-sm text-stone-600">{w.notes}</p>}
                {w.customer.phone && (
                  <a href={telHref(w.customer.phone)} className="mt-0.5 inline-block text-sm text-brand-ink hover:underline">
                    {formatPhone(w.customer.phone)}
                  </a>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => onSeat(w)}
                className="flex min-h-tap flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-3 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-60"
              >
                <CheckIcon size={16} /> Sentar
              </button>
              {w.customer.phone && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onNotify(w)}
                  className="flex min-h-tap items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
                >
                  <BellIcon size={16} /> {w.status === "notified" ? "Avisar de novo" : "Avisar"}
                </button>
              )}
              <div className="ml-auto">
                <ActionsMenu
                  label={`Mais ações para ${w.customer.full_name}`}
                  items={[{ label: "Tirar da fila", tone: "danger", onSelect: () => onRemove(w) }]}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
