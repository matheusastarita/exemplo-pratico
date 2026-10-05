import { dateTimeToUtcMillis, formatTime } from "@/lib/dates";

function toICSDate(millis: number): string {
  const d = new Date(millis);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
  );
}

/** Escape exigido pelo formato iCalendar (RFC 5545). */
function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export type CalendarEvent = {
  code: string;
  restaurantName: string;
  address?: string | null;
  partySize: number;
  date: string;
  startTime: string;
  durationMinutes: number;
  manageUrl?: string;
};

export function buildICS(ev: CalendarEvent): string {
  const startMillis = dateTimeToUtcMillis(ev.date, formatTime(ev.startTime));
  const start = toICSDate(startMillis);
  const end = toICSDate(startMillis + ev.durationMinutes * 60000);
  const people = ev.partySize === 1 ? "1 pessoa" : `${ev.partySize} pessoas`;
  const description = [
    `Mesa para ${people}.`,
    `Código da reserva: ${ev.code}.`,
    ev.manageUrl ? `Ver, alterar ou cancelar: ${ev.manageUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reserva de Mesas//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${ev.code}@reserva-de-mesas`,
    `DTSTAMP:${toICSDate(Date.now())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(`Reserva — ${ev.restaurantName}`)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    ev.address ? `LOCATION:${escapeICS(ev.address)}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS(`Sua reserva no ${ev.restaurantName} é daqui a 2 horas`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadICS(ev: CalendarEvent) {
  const blob = new Blob([buildICS(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reserva-${ev.code}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
