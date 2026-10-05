import { weekdayOf } from "./dates";
import type { PublicInfo } from "./types";

const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_PLURAL = ["domingos", "segundas", "terças", "quartas", "quintas", "sextas", "sábados"];
// Segunda a domingo (0 = domingo fica por último).
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

type Shift = PublicInfo["shifts"][number];

export type HoursSegment = { days: string; hours: string[] };

function runLabel(run: number[]): string {
  if (run.length === 1) return DAY_SHORT[run[0]];
  if (run.length === 2) return `${DAY_SHORT[run[0]]} e ${DAY_SHORT[run[1]]}`;
  return `${DAY_SHORT[run[0]]} a ${DAY_SHORT[run[run.length - 1]]}`;
}

/**
 * Junta os dias que têm os mesmos turnos.
 * Ex.: seg e qua–dom com almoço+jantar => [{ "Seg, Qua a Dom", ["Almoço 12:00–15:00", "Jantar 19:00–23:00"] }]
 */
export function summarizeShifts(shifts: Shift[]): HoursSegment[] {
  const byDay = new Map<number, string[]>();
  for (const s of shifts) {
    const list = byDay.get(s.weekday) ?? [];
    list.push(`${s.name} ${s.open_time}–${s.close_time}`);
    byDay.set(s.weekday, list);
  }

  // agrupa dias com o mesmo conjunto de horários, preservando a ordem seg→dom
  const groups: { key: string; hours: string[]; days: number[] }[] = [];
  for (const wd of WEEK_ORDER) {
    const hours = byDay.get(wd);
    if (!hours) continue;
    const key = hours.join("|");
    const group = groups.find((g) => g.key === key);
    if (group) group.days.push(wd);
    else groups.push({ key, hours, days: [wd] });
  }

  return groups.map((g) => {
    // quebra em sequências consecutivas (na ordem seg→dom)
    const runs: number[][] = [];
    for (const wd of g.days) {
      const last = runs[runs.length - 1];
      const prev = last?.[last.length - 1];
      if (last && WEEK_ORDER.indexOf(wd) === WEEK_ORDER.indexOf(prev) + 1) last.push(wd);
      else runs.push([wd]);
    }
    return { days: runs.map(runLabel).join(", "), hours: g.hours };
  });
}

/** Dias da semana sem nenhum turno aberto. */
export function closedWeekdays(shifts: Shift[]): number[] {
  const open = new Set(shifts.map((s) => s.weekday));
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => !open.has(d));
}

/** "Fechado às terças" (ou null se abre todos os dias). */
export function closedDaysLabel(shifts: Shift[]): string | null {
  const closed = closedWeekdays(shifts);
  if (closed.length === 0) return null;
  const names = WEEK_ORDER.filter((d) => closed.includes(d)).map((d) => DAY_PLURAL[d]);
  const last = names.pop();
  return `Fechado às ${names.length ? `${names.join(", ")} e ${last}` : last}`;
}

/** Motivo de o dia estar fechado (folga semanal ou fechamento do dia inteiro), ou null. */
export function closedReason(info: PublicInfo, date: string): string | null {
  if (closedWeekdays(info.shifts).includes(weekdayOf(date))) return "Fechado";
  if (info.closures.some((c) => c.date === date && c.full_day)) return "Fechado";
  return null;
}

/** Turnos fechados por evento naquele dia (ex.: só o jantar). */
export function closedShiftNames(info: PublicInfo, date: string): string[] {
  return info.closures
    .filter((c) => c.date === date && !c.full_day && c.shift_name)
    .map((c) => c.shift_name as string);
}

export function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function instagramHref(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}
