// Todas as datas/horas do banco são "wall clock" no fuso de São Paulo (UTC-3, sem
// horário de verão desde 2019). Para não depender do timezone da máquina que roda
// o código (dev local vs. servidor na Vercel em UTC), todo cálculo aqui usa apenas
// Date.UTC / getUTC* — nunca os getters "locais" do Date.

const SP_OFFSET_HOURS = 3;

function utcFieldsOf(millis: number) {
  const d = new Date(millis);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(), // 0-based
    day: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
  };
}

function isoFromFields(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function nowInSaoPauloMillis(): number {
  return Date.now() - SP_OFFSET_HOURS * 3600000;
}

export function todayISODate(): string {
  const f = utcFieldsOf(nowInSaoPauloMillis());
  return isoFromFields(f.year, f.month, f.day);
}

/** Hora atual "HH:MM", pra pré-preencher um lançamento feito na hora. */
export function nowTimeHHMM(): string {
  const f = utcFieldsOf(nowInSaoPauloMillis());
  return `${String(f.hours).padStart(2, "0")}:${String(f.minutes).padStart(2, "0")}`;
}

export function dateTimeToUtcMillis(dateISO: string, timeHHMM: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh + SP_OFFSET_HOURS, mm, 0);
}

export function minutesUntil(dateISO: string, timeHHMM: string): number {
  return Math.floor((dateTimeToUtcMillis(dateISO, timeHHMM) - Date.now()) / 60000);
}

export function isPastDateTime(dateISO: string, timeHHMM: string): boolean {
  return minutesUntil(dateISO, timeHHMM) <= 0;
}

export function nextNDays(n: number): string[] {
  const base = utcFieldsOf(nowInSaoPauloMillis());
  const startOfDayUtc = Date.UTC(base.year, base.month, base.day);
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const f = utcFieldsOf(startOfDayUtc + i * 86400000);
    days.push(isoFromFields(f.year, f.month, f.day));
  }
  return days;
}

export function isoDateAddDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const f = utcFieldsOf(Date.UTC(y, m - 1, d) + days * 86400000);
  return isoFromFields(f.year, f.month, f.day);
}

/** Quantos dias já passaram de uma data (calendário) até hoje. */
export function daysSince(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [ty, tm, td] = todayISODate().split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000);
}

/** Últimos n dias terminando hoje (mais antigo primeiro). */
export function lastNDays(n: number): string[] {
  const today = todayISODate();
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(isoDateAddDays(today, -i));
  }
  return days;
}

export function weekdayOf(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAY_FULL = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const MONTH_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
const MONTH_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function weekdayShortLabel(dateISO: string): string {
  return WEEKDAY_SHORT[weekdayOf(dateISO)];
}

export function monthShortLabel(dateISO: string): string {
  const [y, m] = dateISO.split("-").map(Number);
  return `${MONTH_FULL[m - 1]} ${y}`;
}

export function dayOfMonth(dateISO: string): number {
  return Number(dateISO.split("-")[2]);
}

/** "Bom dia" / "Boa tarde" / "Boa noite" conforme a hora em São Paulo. */
export function greetingForNow(): string {
  const hour = new Date(nowInSaoPauloMillis()).getUTCHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function weekdayFullLabel(weekday: number): string {
  return WEEKDAY_FULL[weekday];
}

export function dayMonthLabel(dateISO: string): string {
  const [, m, d] = dateISO.split("-").map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}`;
}

export function isToday(dateISO: string): boolean {
  return dateISO === todayISODate();
}

/** Domingo da semana que contém a data (a grade do calendário começa no domingo). */
export function startOfWeekSunday(dateISO: string): string {
  return isoDateAddDays(dateISO, -weekdayOf(dateISO));
}

export function firstOfMonth(dateISO: string): string {
  const [y, m] = dateISO.split("-");
  return `${y}-${m}-01`;
}

export function lastOfMonth(dateISO: string): string {
  const [y, m] = dateISO.split("-").map(Number);
  // dia 0 do mês seguinte = último dia deste mês
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return isoFromFields(y, m - 1, last);
}

/** Primeiro dia do mês, deslocado em `delta` meses. */
export function shiftMonth(dateISO: string, delta: number): string {
  const [y, m] = dateISO.split("-").map(Number);
  const f = utcFieldsOf(Date.UTC(y, m - 1 + delta, 1));
  return isoFromFields(f.year, f.month, 1);
}

/** 42 datas (6 semanas, começando no domingo) cobrindo o mês da data. */
export function monthGridDays(dateISO: string): string[] {
  const start = startOfWeekSunday(firstOfMonth(dateISO));
  return Array.from({ length: 42 }, (_, i) => isoDateAddDays(start, i));
}

/** "Setembro de 2026" */
export function monthTitle(dateISO: string): string {
  const [y, m] = dateISO.split("-").map(Number);
  return `${MONTH_FULL[m - 1]} de ${y}`;
}

export function datesBetween(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  for (let d = startISO; d <= endISO; d = isoDateAddDays(d, 1)) out.push(d);
  return out;
}

/** "Terça-feira, 23 de setembro de 2026" */
export function formatDateFull(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return `${weekdayFullLabel(weekdayOf(dateISO))}, ${d} de ${MONTH_FULL[m - 1].toLowerCase()} de ${y}`;
}

/** "Terça-feira, 23 de setembro" (sem ano — pra listas onde o ano não cabe/não ajuda). */
export function formatWeekdayDate(dateISO: string): string {
  const [, m, d] = dateISO.split("-").map(Number);
  return `${weekdayFullLabel(weekdayOf(dateISO))}, ${d} de ${MONTH_FULL[m - 1].toLowerCase()}`;
}

/** "Qui, 1 de outubro" — versão compacta, pra linhas de lista estreitas. */
export function formatWeekdayDateShort(dateISO: string): string {
  const [, m, d] = dateISO.split("-").map(Number);
  return `${weekdayShortLabel(dateISO)}, ${d} de ${MONTH_FULL[m - 1].toLowerCase()}`;
}

/** "SET" */
export function monthAbbrev(dateISO: string): string {
  const m = Number(dateISO.split("-")[1]);
  return MONTH_SHORT[m - 1].toUpperCase();
}

/** "Hoje, 22 de setembro de 2026" (ou o dia da semana, quando não é hoje). */
export function formatDateHeading(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const prefix = isToday(dateISO) ? "Hoje" : weekdayFullLabel(weekdayOf(dateISO));
  return `${prefix}, ${d} de ${MONTH_FULL[m - 1].toLowerCase()} de ${y}`;
}

export function startOfWeekISODate(): string {
  const todayIso = todayISODate();
  const wd = weekdayOf(todayIso);
  const diffToMonday = wd === 0 ? 6 : wd - 1;
  const [y, m, d] = todayIso.split("-").map(Number);
  const f = utcFieldsOf(Date.UTC(y, m - 1, d) - diffToMonday * 86400000);
  return isoFromFields(f.year, f.month, f.day);
}

export function startOfMonthISODate(): string {
  const [y, m] = todayISODate().split("-");
  return `${y}-${m}-01`;
}

export function startOfYearISODate(): string {
  const [y] = todayISODate().split("-");
  return `${y}-01-01`;
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function addMinutesToTime(timeHHMM: string, minutes: number): string {
  const [hh, mm] = formatTime(timeHHMM).split(":").map(Number);
  const total = hh * 60 + mm + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDateLong(dateISO: string): string {
  return `${weekdayFullLabel(weekdayOf(dateISO))}, ${dayMonthLabel(dateISO)}`;
}
