"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDuration, peopleLabel } from "@/lib/format";
import { minutesSeated, TABLE_STATE_LABEL, type TableStatus } from "@/lib/salao";
import type { HostDay, HostReservation, HostTable } from "@/lib/types";

/** Toque numa mesa do mapa: quem está nela, próximas reservas e ações da mesa. */
export function TableDialog({
  table,
  day,
  status,
  now,
  isToday,
  busy,
  onClose,
  onOpenReservation,
  onWalkIn,
  onClean,
  onBlock,
  onComplete,
}: {
  table: HostTable | null;
  day: HostDay;
  status: TableStatus | undefined;
  now: number;
  isToday: boolean;
  busy: boolean;
  onClose: () => void;
  onOpenReservation: (r: HostReservation) => void;
  onWalkIn: (t: HostTable) => void;
  onClean: (t: HostTable) => void;
  onBlock: (t: HostTable, blocked: boolean, reason?: string) => void;
  onComplete: (r: HostReservation) => void;
}) {
  const [reason, setReason] = useState("");
  const [askReason, setAskReason] = useState(false);
  if (!table || !status) return null;

  const area = day.areas.find((a) => a.id === table.area_id)?.name ?? "";
  const reservations = day.reservations
    .filter((r) => r.table_ids.includes(table.id) && r.status !== "cancelled")
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const current = status.current;
  const seatedMins = current ? minutesSeated(current, now) : null;

  function close() {
    setAskReason(false);
    setReason("");
    onClose();
  }

  return (
    <Modal
      open
      onClose={close}
      title={`Mesa ${table.label}`}
      description={`${area} · ${table.min_seats}–${table.max_seats} lugares${table.combinable ? " · pode juntar" : ""}`}
    >
      <div className="flex flex-col gap-5">
        {isToday && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.state === "free" ? "confirmed" : status.state === "occupied" ? "seated" : status.state === "late" ? "late" : status.state === "blocked" ? "cancelled" : "warning"} size="md">
              {TABLE_STATE_LABEL[status.state]}
            </Badge>
            {table.blocked && table.blocked_reason && <span className="text-sm text-stone-600">{table.blocked_reason}</span>}
          </div>
        )}

        {current && (
          <div className="rounded-control border border-status-seated/30 bg-status-seated-bg p-4">
            <p className="text-sm text-status-seated">Na mesa agora</p>
            <button type="button" onClick={() => onOpenReservation(current)} className="mt-0.5 text-left text-lg font-semibold text-stone-900 hover:underline">
              {current.customer.full_name}
            </button>
            <p className="text-sm text-stone-700">
              {peopleLabel(current.party_size)}
              {seatedMins !== null ? ` · há ${formatDuration(seatedMins)} (previsto ${formatDuration(current.duration_minutes)})` : ""}
            </p>
            <Button className="mt-3 w-full" variant="primary" disabled={busy} onClick={() => onComplete(current)}>
              Liberar mesa
            </Button>
          </div>
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold text-stone-900">Reservas nesta mesa no dia</h3>
          {reservations.length === 0 ? (
            <p className="text-sm text-stone-500">Nenhuma reserva nesta mesa.</p>
          ) : (
            <ul className="divide-y divide-stone-100 rounded-control border border-stone-200">
              {reservations.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onOpenReservation(r)} className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-stone-50">
                    <span className="min-w-0">
                      <span className="font-semibold tabular-nums text-stone-900">{r.start_time}</span>{" "}
                      <span className="text-stone-700">{r.customer.full_name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-stone-500">{peopleLabel(r.party_size)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isToday && (
          <div className="flex flex-col gap-2">
            {!current && !table.blocked && (
              <Button disabled={busy} onClick={() => onWalkIn(table)}>
                Sentar cliente sem reserva aqui
              </Button>
            )}
            {status.state === "cleaning" && (
              <Button variant="secondary" disabled={busy} onClick={() => onClean(table)}>
                Mesa limpa e pronta
              </Button>
            )}
            {table.blocked ? (
              <Button variant="secondary" disabled={busy} onClick={() => onBlock(table, false)}>
                Desbloquear mesa
              </Button>
            ) : askReason ? (
              <div className="flex flex-col gap-2 rounded-control bg-stone-50 p-3">
                <Input id="block-reason" label="Motivo do bloqueio" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cadeira quebrada" />
                <Button variant="danger" disabled={busy} onClick={() => onBlock(table, true, reason)}>
                  Bloquear mesa
                </Button>
              </div>
            ) : (
              !current && (
                <Button variant="ghost" disabled={busy} onClick={() => setAskReason(true)}>
                  Bloquear mesa temporariamente
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
