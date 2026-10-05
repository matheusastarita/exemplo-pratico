"use client";

import { dayOfMonth, isToday, monthAbbrev, weekdayFullLabel, weekdayOf, weekdayShortLabel } from "@/lib/dates";

export type DayState = "open" | "closed" | "full";

/** Faixa de dias rolável. Fechados: riscados e desabilitados. Lotados: marcados (levam à lista de espera). */
export function DayStrip({
  days,
  activeDate,
  stateOf,
  onSelect,
}: {
  days: string[];
  activeDate: string | null;
  stateOf: (date: string) => DayState;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-1 sm:px-1" role="listbox" aria-label="Escolha a data">
      <div className="flex gap-2">
        {days.map((date, i) => {
          const state = stateOf(date);
          const active = date === activeDate;
          const closed = state === "closed";
          const newMonth = i === 0 || date.slice(5, 7) !== days[i - 1].slice(5, 7);
          return (
            <button
              key={date}
              type="button"
              role="option"
              aria-selected={active}
              disabled={closed}
              aria-label={`${weekdayFullLabel(weekdayOf(date))}, ${dayOfMonth(date)}${
                closed ? ", fechado" : state === "full" ? ", lotado" : ""
              }`}
              onClick={() => onSelect(date)}
              className={`relative flex h-[74px] w-[60px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-control border transition-all disabled:cursor-not-allowed ${
                active
                  ? "border-brand bg-brand text-brand-contrast shadow-md shadow-brand/25"
                  : closed
                    ? "border-transparent bg-stone-100/70 text-stone-300"
                    : "border-stone-200 bg-white text-stone-800 hover:border-stone-300"
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  active ? "opacity-80" : closed ? "" : "text-stone-500"
                }`}
              >
                {isToday(date) ? "Hoje" : weekdayShortLabel(date)}
              </span>
              <span className={`text-xl font-semibold leading-none ${closed ? "line-through" : ""}`}>
                {dayOfMonth(date)}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  active
                    ? "opacity-80"
                    : state === "full"
                      ? "text-status-no-show"
                      : closed
                        ? ""
                        : "text-stone-500"
                }`}
              >
                {closed ? "Fechado" : state === "full" ? "Lotado" : newMonth ? monthAbbrev(date) : " "}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
