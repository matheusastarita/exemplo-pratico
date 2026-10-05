"use client";

import { CheckIcon } from "@/components/icons";
import { TABLE_STATE_LABEL, tablesSeats, type TableStatus } from "@/lib/salao";
import type { HostDay } from "@/lib/types";

/**
 * Lista de mesas para escolher (uma ou várias, para juntar). Mesas ocupadas ou
 * bloqueadas ficam desabilitadas — exceto as da própria reserva.
 */
export function TablePicker({
  day,
  statuses,
  party,
  selected,
  onChange,
  ownTableIds = [],
}: {
  day: HostDay;
  statuses: Map<string, TableStatus>;
  party: number;
  selected: string[];
  onChange: (ids: string[]) => void;
  ownTableIds?: string[];
}) {
  const seats = tablesSeats(day.tables, selected);

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  return (
    <div className="flex flex-col gap-4">
      <p
        className={`rounded-control px-3 py-2 text-sm ${
          selected.length === 0
            ? "bg-stone-50 text-stone-600"
            : seats >= party
              ? "bg-status-confirmed-bg text-status-confirmed"
              : "bg-amber-50 text-amber-800"
        }`}
        aria-live="polite"
      >
        {selected.length === 0
          ? `Escolha uma mesa (ou junte várias) para ${party} ${party === 1 ? "pessoa" : "pessoas"}.`
          : seats >= party
            ? `${seats} lugares para ${party} ${party === 1 ? "pessoa" : "pessoas"}.`
            : `Só ${seats} lugares para ${party} pessoas — junte mais uma mesa.`}
      </p>

      {day.areas.map((area) => {
        const tables = day.tables.filter((t) => t.area_id === area.id);
        if (tables.length === 0) return null;
        return (
          <div key={area.id}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{area.name}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tables.map((t) => {
                const status = statuses.get(t.id);
                const own = ownTableIds.includes(t.id);
                const unavailable =
                  !own && (status?.state === "occupied" || status?.state === "check" || status?.state === "blocked");
                const active = selected.includes(t.id);
                const reservedSoon = !own && (status?.state === "soon" || status?.state === "late");
                const note = own
                  ? "Desta reserva"
                  : status
                    ? status.state === "soon" || status.state === "late"
                      ? `Reservada às ${status.next?.start_time ?? ""}`
                      : TABLE_STATE_LABEL[status.state]
                    : "";
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={unavailable}
                    aria-pressed={active}
                    onClick={() => toggle(t.id)}
                    className={`flex min-h-14 items-center gap-2 rounded-control border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      active
                        ? "border-brand bg-brand-soft"
                        : reservedSoon
                          ? "border-amber-100 bg-amber-50 hover:bg-amber-100"
                          : "border-stone-200 bg-white hover:bg-stone-50"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-1.5 text-sm font-bold ${
                        active ? "bg-brand text-brand-contrast" : "bg-stone-100 text-stone-800"
                      }`}
                    >
                      {t.label}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="sr-only">Mesa {t.label}, </span>
                      <span className="block text-sm font-semibold text-stone-900">{t.max_seats} lugares</span>
                      <span className={`block text-xs leading-tight ${reservedSoon ? "font-medium text-amber-800" : "text-stone-500"}`}>{note}</span>
                    </span>
                    {active && <CheckIcon size={18} className="shrink-0 text-brand-ink" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
