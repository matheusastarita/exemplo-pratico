"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { groupSlotsByShift } from "@/lib/reservas";
import { formatTime } from "@/lib/dates";
import type { AvailableSlot } from "@/lib/types";

/** Grade de horários livres agrupada por turno, com aviso de "últimas mesas". */
export function TimeSlots({
  slots,
  loading,
  selected,
  onSelect,
}: {
  slots: AvailableSlot[];
  loading: boolean;
  selected: string | null;
  onSelect: (time: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Carregando horários">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-control" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groupSlotsByShift(slots).map((group) => (
        <div key={group.shift}>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
            {group.shift}
          </p>
          <div role="radiogroup" aria-label={`Horários do ${group.shift.toLowerCase()}`} className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {group.slots.map((slot) => {
              const time = formatTime(slot.slot_time);
              const active = time === selected;
              const few = slot.tables_left <= 2;
              return (
                <button
                  key={time}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`${time}${few ? ", últimas mesas" : ""}`}
                  onClick={() => onSelect(time)}
                  className={`relative flex h-12 flex-col items-center justify-center rounded-control border text-sm font-semibold tabular-nums transition-all active:scale-[0.97] ${
                    active
                      ? "border-brand bg-brand text-brand-contrast shadow-md shadow-brand/25"
                      : "border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  {time}
                  {few && (
                    <span
                      className={`text-[9px] font-medium uppercase leading-none tracking-wide ${
                        active ? "opacity-85" : "text-status-late"
                      }`}
                    >
                      Últimas
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
