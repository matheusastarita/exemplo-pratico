// Regras de exibição do painel do salão (adaptado de agenda.ts do projeto anterior).
// Nada aqui inventa dado: tudo é derivado do que veio de host_day().
import { dateTimeToUtcMillis } from "./dates";
import type { HostDay, HostReservation, HostTable, ReservationStatus } from "./types";

/** Status como aparece no painel. "late" = confirmada que passou da tolerância e o grupo não chegou. */
export type DisplayStatus = ReservationStatus | "late";

export function minutesFromNow(date: string, time: string, nowMillis: number): number {
  return Math.round((dateTimeToUtcMillis(date, time) - nowMillis) / 60000);
}

export function displayStatusOf(r: HostReservation, nowMillis: number, graceMinutes: number): DisplayStatus {
  if (r.status === "confirmed" || r.status === "pending") {
    if (minutesFromNow(r.date, r.start_time, nowMillis) < -graceMinutes) return "late";
  }
  return r.status;
}

export function isActive(r: HostReservation) {
  return r.status === "pending" || r.status === "confirmed" || r.status === "seated";
}

export function hasAllergy(r: HostReservation): boolean {
  return Boolean(r.dietary_notes?.trim() || r.customer.allergies?.trim());
}

export function allergyText(r: HostReservation): string {
  return [r.dietary_notes, r.customer.allergies].filter((t) => t && t.trim()).join(" · ");
}

export function isVip(r: { customer: { tags: string[] } }) {
  return r.customer.tags.includes("VIP");
}

export function isBirthday(r: HostReservation): boolean {
  if (r.occasion === "aniversario") return true;
  const b = r.customer.birthday;
  return Boolean(b && b.slice(5) === r.date.slice(5));
}

/** Minutos desde que o grupo sentou (a partir de seated_at, timestamp real). */
export function minutesSeated(r: HostReservation, nowMillis: number): number | null {
  if (!r.seated_at) return null;
  return Math.max(0, Math.round((nowMillis - new Date(r.seated_at).getTime()) / 60000));
}

// ----------------------------------------------------------------------------
// Estado das mesas no mapa
// ----------------------------------------------------------------------------

export type TableState = "free" | "soon" | "late" | "occupied" | "check" | "cleaning" | "blocked";

export const TABLE_STATE_LABEL: Record<TableState, string> = {
  free: "Livre",
  soon: "Reservada em breve",
  late: "Reserva atrasada",
  occupied: "Ocupada",
  check: "Pediu a conta",
  cleaning: "A limpar",
  blocked: "Bloqueada",
};

export type TableStatus = {
  state: TableState;
  /** Reserva sentada nesta mesa agora. */
  current: HostReservation | null;
  /** Próxima reserva ativa (não sentada) nesta mesa no dia. */
  next: HostReservation | null;
  /** Reservas do dia nesta mesa (para dias que não são hoje). */
  dayCount: number;
};

const SOON_MINUTES = 60;

export function tableStatuses(day: HostDay, nowMillis: number, isToday: boolean): Map<string, TableStatus> {
  const map = new Map<string, TableStatus>();
  const grace = day.settings.grace_minutes;

  for (const t of day.tables) {
    const onTable = day.reservations
      .filter((r) => r.table_ids.includes(t.id) && r.status !== "cancelled" && r.status !== "no_show")
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    const current = onTable.find((r) => r.status === "seated") ?? null;
    const next =
      onTable.find(
        (r) =>
          (r.status === "confirmed" || r.status === "pending") &&
          minutesFromNow(r.date, r.start_time, nowMillis) > -(grace + 240)
      ) ?? null;

    let state: TableState = "free";
    if (t.blocked) state = "blocked";
    else if (isToday && current) state = current.check_requested_at ? "check" : "occupied";
    else if (isToday && t.cleaning_since) state = "cleaning";
    else if (isToday && next) {
      const mins = minutesFromNow(next.date, next.start_time, nowMillis);
      if (mins < -grace) state = "late";
      else if (mins <= SOON_MINUTES) state = "soon";
    }

    map.set(t.id, {
      state,
      current: isToday ? current : null,
      next,
      dayCount: onTable.filter((r) => r.status !== "completed" || !isToday).length,
    });
  }
  return map;
}

export function tableLabels(day: HostDay, ids: string[]): string {
  const byId = new Map(day.tables.map((t) => [t.id, t.label]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .join(" + ");
}

export function tablesSeats(tables: HostTable[], ids: string[]): number {
  return tables.filter((t) => ids.includes(t.id)).reduce((sum, t) => sum + t.max_seats, 0);
}

// ----------------------------------------------------------------------------
// Resumo do dia
// ----------------------------------------------------------------------------

export type DaySummary = {
  reservations: number;
  people: number;
  seated: number;
  seatedPeople: number;
  upcoming: number;
  late: number;
  completed: number;
  noShows: number;
  cancelled: number;
  tablesFree: number;
  tablesBusy: number;
  waiting: number;
};

export function summarizeDay(
  day: HostDay,
  statuses: Map<string, TableStatus>,
  nowMillis: number
): DaySummary {
  const grace = day.settings.grace_minutes;
  const s: DaySummary = {
    reservations: 0,
    people: 0,
    seated: 0,
    seatedPeople: 0,
    upcoming: 0,
    late: 0,
    completed: 0,
    noShows: 0,
    cancelled: 0,
    tablesFree: 0,
    tablesBusy: 0,
    waiting: day.waitlist.length,
  };
  for (const r of day.reservations) {
    const st = displayStatusOf(r, nowMillis, grace);
    if (st === "cancelled") {
      s.cancelled += 1;
      continue;
    }
    s.reservations += 1;
    if (st === "no_show") {
      s.noShows += 1;
      continue;
    }
    s.people += r.party_size;
    if (st === "seated") {
      s.seated += 1;
      s.seatedPeople += r.party_size;
    } else if (st === "late") s.late += 1;
    else if (st === "completed") s.completed += 1;
    else s.upcoming += 1;
  }
  for (const status of statuses.values()) {
    if (status.state === "occupied" || status.state === "check") s.tablesBusy += 1;
    else if (status.state !== "blocked") s.tablesFree += 1;
  }
  return s;
}

/** Turno em andamento (ou o próximo do dia), para o cabeçalho. */
export function currentShift(day: HostDay, nowHHMM: string, isToday: boolean) {
  if (!isToday) return day.shifts[0] ?? null;
  return (
    day.shifts.find((s) => nowHHMM >= s.open_time && nowHHMM <= s.close_time) ??
    day.shifts.find((s) => s.open_time > nowHHMM) ??
    null
  );
}

/** Busca simples por nome, telefone ou código. */
export function matchesQuery(r: HostReservation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    r.customer.full_name.toLowerCase().includes(q) ||
    r.code.toLowerCase().includes(q) ||
    (digits.length >= 3 && (r.customer.phone ?? "").includes(digits))
  );
}
