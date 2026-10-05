import { firstOfMonth, isoDateAddDays, startOfWeekSunday, weekdayOf } from "./dates";
import type { ReportDailyRow } from "./types";

export type Period = "7d" | "30d" | "mes" | "3m" | "ano" | "dia";

export const PERIOD_LABEL: Record<Period, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  mes: "Este mês",
  "3m": "3 meses",
  ano: "12 meses",
  dia: "Um dia",
};

/** Intervalo do período (sempre terminando hoje, exceto "dia"). */
export function periodRange(period: Period, today: string, day: string): [string, string] {
  switch (period) {
    case "7d":
      return [isoDateAddDays(today, -6), today];
    case "30d":
      return [isoDateAddDays(today, -29), today];
    case "mes":
      return [firstOfMonth(today), today];
    case "3m":
      return [isoDateAddDays(today, -89), today];
    case "ano":
      return [isoDateAddDays(today, -364), today];
    case "dia":
      return [day, day];
  }
}

export function daysIn([from, to]: [string, string]): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
}

/**
 * Período de comparação: o mesmo número de dias logo antes. Um dia só compara
 * com o mesmo dia da semana anterior (segunda com segunda faz mais sentido).
 */
export function previousRange(period: Period, range: [string, string]): [string, string] {
  if (period === "dia") return [isoDateAddDays(range[0], -7), isoDateAddDays(range[1], -7)];
  const n = daysIn(range);
  return [isoDateAddDays(range[0], -n), isoDateAddDays(range[0], -1)];
}

export type Grouping = "day" | "week" | "month";

/** Até 45 dias, barra por dia; até 4 meses, por semana; acima disso, por mês. */
export function groupingFor(days: number): Grouping {
  if (days <= 45) return "day";
  if (days <= 120) return "week";
  return "month";
}

export type GroupedRow = {
  key: string;
  start: string;
  end: string;
  reservations: number;
  people: number;
  cancelled: number;
  no_shows: number;
  walk_ins: number;
  capacity_minutes: number;
  used_minutes: number;
  /** used / capacity (null quando o restaurante não abriu no período). */
  occupancy: number | null;
};

/** Semana começando na segunda-feira. */
function weekStart(day: string): string {
  return weekdayOf(day) === 0 ? isoDateAddDays(day, -6) : isoDateAddDays(startOfWeekSunday(day), 1);
}

/** Soma os dias em semanas ou meses. Ocupação = soma dos minutos usados / soma da capacidade. */
export function groupDaily(rows: ReportDailyRow[], grouping: Grouping): GroupedRow[] {
  const out = new Map<string, GroupedRow>();
  for (const r of rows) {
    const key = grouping === "day" ? r.day : grouping === "week" ? weekStart(r.day) : r.day.slice(0, 7);
    const g =
      out.get(key) ??
      ({
        key,
        start: r.day,
        end: r.day,
        reservations: 0,
        people: 0,
        cancelled: 0,
        no_shows: 0,
        walk_ins: 0,
        capacity_minutes: 0,
        used_minutes: 0,
        occupancy: null,
      } satisfies GroupedRow);
    g.end = r.day;
    g.reservations += r.reservations;
    g.people += r.people;
    g.cancelled += r.cancelled;
    g.no_shows += r.no_shows;
    g.walk_ins += r.walk_ins;
    g.capacity_minutes += Number(r.capacity_minutes);
    g.used_minutes += Number(r.used_minutes);
    out.set(key, g);
  }
  return [...out.values()].map((g) => ({
    ...g,
    occupancy: g.capacity_minutes > 0 ? Math.round((1000 * g.used_minutes) / g.capacity_minutes) / 10 : null,
  }));
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return `${MONTHS[m - 1]}/${String(y).slice(2)}`;
}
