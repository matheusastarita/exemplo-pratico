"use client";

import { useState } from "react";
import {
  AlertIcon,
  BanIcon,
  CheckIcon,
  ClockIcon,
  PeopleIcon,
  ReceiptIcon,
  SparkleIcon,
} from "@/components/icons";
import { formatDuration } from "@/lib/format";
import { minutesSeated, TABLE_STATE_LABEL, type TableState, type TableStatus } from "@/lib/salao";
import type { HostDay, HostTable } from "@/lib/types";

const STATE_STYLE: Record<TableState, string> = {
  free: "bg-white border-status-confirmed/60 text-stone-800",
  soon: "bg-status-pending-bg border-status-pending/60 text-status-pending",
  late: "bg-status-late-bg border-status-late/70 text-status-late",
  occupied: "bg-status-seated-bg border-status-seated/60 text-status-seated",
  check: "bg-amber-100 border-amber-700/60 text-amber-800",
  cleaning: "bg-stone-100 border-stone-400 text-stone-600 border-dashed",
  blocked: "bg-stone-200/80 border-stone-400 text-stone-500",
};

const STATE_ICON: Record<TableState, (p: { size?: number }) => React.ReactElement> = {
  free: CheckIcon,
  soon: ClockIcon,
  late: AlertIcon,
  occupied: PeopleIcon,
  check: ReceiptIcon,
  cleaning: SparkleIcon,
  blocked: BanIcon,
};

/** Texto curto dentro da mesa (sempre junto do ícone — nunca só a cor). */
function stateLine(status: TableStatus, now: number, isToday: boolean): string {
  if (!isToday) {
    return status.dayCount > 0 ? `${status.dayCount} reserva${status.dayCount > 1 ? "s" : ""}` : "Livre";
  }
  switch (status.state) {
    case "occupied":
    case "check": {
      const mins = status.current ? minutesSeated(status.current, now) : null;
      return mins !== null ? formatDuration(mins) : TABLE_STATE_LABEL[status.state];
    }
    case "soon":
    case "late":
      return status.next?.start_time ?? "";
    case "cleaning":
      return "Limpar";
    case "blocked":
      return "Bloq.";
    default:
      return status.next ? status.next.start_time : "Livre";
  }
}

export function TableMap({
  day,
  statuses,
  isToday,
  now,
  area,
  onAreaChange,
  onTableClick,
  onDropReservation,
  selectedIds,
  compact = false,
}: {
  day: HostDay;
  statuses: Map<string, TableStatus>;
  isToday: boolean;
  now: number;
  area: string | null;
  onAreaChange: (id: string) => void;
  onTableClick: (t: HostTable) => void;
  onDropReservation?: (reservationId: string, table: HostTable) => void;
  /** Mesas destacadas (ex.: escolhidas no "sentar"). */
  selectedIds?: string[];
  compact?: boolean;
}) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const currentArea = area ?? day.areas[0]?.id ?? null;
  const tables = day.tables.filter((t) => t.area_id === currentArea);

  const countFree = (areaId: string) =>
    day.tables.filter((t) => t.area_id === areaId && statuses.get(t.id)?.state === "free").length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2" role="tablist" aria-label="Áreas do salão">
        {day.areas.map((a) => {
          const active = a.id === currentArea;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onAreaChange(a.id)}
              className={`flex min-h-tap items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                active ? "bg-brand text-brand-contrast" : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {a.name}
              {isToday && (
                <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-stone-100 text-stone-600"}`}>
                  {countFree(a.id)} livres
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div
          className={`relative w-full rounded-card border border-stone-200 bg-[rgb(var(--c-stone-50))] ${
            compact ? "min-w-[500px]" : "min-w-[520px]"
          } aspect-[16/10]`}
          aria-label="Mapa de mesas"
        >
          {tables.map((t) => {
            const status = statuses.get(t.id);
            if (!status) return null;
            const Icon = STATE_ICON[isToday ? status.state : status.dayCount > 0 ? "soon" : "free"];
            const style = isToday
              ? STATE_STYLE[status.state]
              : status.dayCount > 0
                ? STATE_STYLE.soon
                : STATE_STYLE.free;
            const selected = selectedIds?.includes(t.id);
            const over = dragOver === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTableClick(t)}
                onDragOver={(e) => {
                  if (!onDropReservation) return;
                  e.preventDefault();
                  setDragOver(t.id);
                }}
                onDragLeave={() => setDragOver((d) => (d === t.id ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const id = e.dataTransfer.getData("text/reservation");
                  if (id && onDropReservation) onDropReservation(id, t);
                }}
                aria-label={`Mesa ${t.label}, ${t.max_seats} lugares, ${
                  isToday ? TABLE_STATE_LABEL[status.state] : `${status.dayCount} reservas no dia`
                }${status.current ? `, ${status.current.customer.full_name}` : ""}`}
                style={{
                  left: `${t.pos_x}%`,
                  top: `${t.pos_y}%`,
                  width: `${t.width}%`,
                  height: `${t.height}%`,
                }}
                className={`absolute flex flex-col items-center justify-center gap-0.5 overflow-hidden border-2 p-0.5 text-center shadow-sm transition-transform hover:scale-[1.03] focus-visible:scale-[1.03] ${
                  t.shape === "round" ? "rounded-full" : "rounded-xl"
                } ${style} ${selected ? "ring-4 ring-brand/60" : ""} ${over ? "scale-105 ring-4 ring-brand" : ""}`}
              >
                <span className="text-sm font-bold leading-none text-stone-900 sm:text-base">{t.label}</span>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold leading-none sm:text-[11px]">
                  <Icon size={11} />
                  <span className="truncate">{stateLine(status, now, isToday)}</span>
                </span>
                <span className="text-[9px] leading-none text-stone-500">{t.max_seats} lug.</span>
              </button>
            );
          })}
        </div>
      </div>

      {isToday && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600" aria-label="Legenda do mapa">
          {(Object.keys(TABLE_STATE_LABEL) as TableState[]).map((s) => {
            const Icon = STATE_ICON[s];
            return (
              <li key={s} className="flex items-center gap-1.5">
                <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${STATE_STYLE[s]}`}>
                  <Icon size={11} />
                </span>
                {TABLE_STATE_LABEL[s]}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
