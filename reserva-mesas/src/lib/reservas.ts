// Utilidades de reserva compartilhadas entre a página pública, a área do cliente e o painel.
import { formatTime } from "./dates";
import { STATUS_LABEL } from "./constants";
import type { AvailableSlot, ReservationStatus } from "./types";

/** Guarda o telefone na aba atual para abrir /r/[code] sem pedir de novo (conveniência). */
const PHONE_KEY = (code: string) => `reserva:${code}:phone`;

export function rememberPhone(code: string, phone: string) {
  try {
    sessionStorage.setItem(PHONE_KEY(code), phone);
  } catch {
    // modo privado/armazenamento bloqueado: a pessoa digita o telefone de novo, sem problema
  }
}

export function recallPhone(code: string): string | null {
  try {
    return sessionStorage.getItem(PHONE_KEY(code));
  } catch {
    return null;
  }
}

/** Agrupa os horários livres por turno (Almoço, Jantar...), na ordem em que vêm. */
export function groupSlotsByShift(slots: AvailableSlot[]): { shift: string; slots: AvailableSlot[] }[] {
  const groups: { shift: string; slots: AvailableSlot[] }[] = [];
  for (const slot of slots) {
    const last = groups[groups.length - 1];
    if (last && last.shift === slot.shift_name) last.slots.push(slot);
    else groups.push({ shift: slot.shift_name, slots: [slot] });
  }
  return groups;
}

export function slotLabel(slot: AvailableSlot): string {
  return formatTime(slot.slot_time);
}

/** Status como o cliente vê (sem jargão de operação). */
export function customerStatusLabel(status: ReservationStatus): string {
  if (status === "pending") return "Aguardando sinal";
  if (status === "seated") return "Na mesa";
  return STATUS_LABEL[status];
}

export function manageUrl(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/r/${code}`;
}
