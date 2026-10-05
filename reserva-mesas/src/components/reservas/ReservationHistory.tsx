"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhatsAppPreview } from "@/components/WhatsAppPreview";
import { SOURCE_LABEL, STATUS_LABEL } from "@/lib/constants";
import type { MessageKind, ReservationHistory, ReservationStatus } from "@/lib/types";

export const MESSAGE_KIND_LABEL: Record<MessageKind, string> = {
  confirmacao: "Confirmação",
  lembrete_24h: "Lembrete (24h antes)",
  lembrete_2h: "Lembrete (2h antes)",
  alteracao: "Alteração",
  cancelamento: "Cancelamento",
  lista_espera: "Lista de espera",
  manual: "Mensagem da equipe",
};

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventText(e: ReservationHistory["events"][number]): string {
  const d = (e.details ?? {}) as Record<string, string | number | boolean>;
  if (e.action === "created") {
    return `Reserva criada (${SOURCE_LABEL[d.source as keyof typeof SOURCE_LABEL] ?? "—"})`;
  }
  if (e.action === "tables") return d.tables ? `Mesa definida: ${d.tables}` : "Mesas liberadas";
  const parts: string[] = [];
  if (d.status_to) {
    parts.push(
      `${STATUS_LABEL[d.status_from as ReservationStatus] ?? d.status_from} → ${
        STATUS_LABEL[d.status_to as ReservationStatus] ?? d.status_to
      }`
    );
  }
  if (d.reason) parts.push(`motivo: ${d.reason}`);
  if (d.from) parts.push(`horário ${d.from} → ${d.to}`);
  if (d.party_to) parts.push(`pessoas ${d.party_from} → ${d.party_to}`);
  if (d.notes_changed) parts.push("observações editadas");
  if (d.customer_confirmed) parts.push("cliente confirmou presença");
  if (d.deposit_to) parts.push(`sinal: ${d.deposit_to === "paid" ? "pago" : d.deposit_to}`);
  if (d.check_requested) parts.push("pediu a conta");
  return parts.join(" · ") || "Atualização";
}

/** Histórico de uma reserva: quem mudou o quê, e as mensagens (simuladas) enviadas. */
export function ReservationHistoryView({ reservationId, restaurant }: { reservationId: string; restaurant: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [history, setHistory] = useState<{ id: string; data: ReservationHistory | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("reservation_history", { p_id: reservationId }).then(({ data }) => {
      if (!cancelled) setHistory({ id: reservationId, data: data ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [reservationId, supabase]);

  if (history?.id !== reservationId) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-label="Carregando histórico">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  const events = history.data?.events ?? [];
  const messages = history.data?.messages ?? [];

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-stone-900">Histórico de mudanças</h3>
        <ol className="flex flex-col gap-2 border-l-2 border-stone-200 pl-4 text-sm">
          {events.map((e, i) => (
            <li key={i} className="text-stone-700">
              <span className="text-xs text-stone-500">{formatWhen(e.created_at)}</span> · {eventText(e)}
              <span className="text-stone-500">
                {" — "}
                {e.actor_name ??
                  (e.action === "created" && (e.details as { source?: string } | null)?.source === "site"
                    ? "cliente, pelo site"
                    : "sistema")}
              </span>
            </li>
          ))}
          {events.length === 0 && <li className="text-stone-500">Sem mudanças registradas.</li>}
        </ol>
      </section>

      {messages.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-stone-900">Mensagens enviadas</h3>
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i}>
                <p className="mb-1 text-xs text-stone-500">
                  {MESSAGE_KIND_LABEL[m.kind] ?? m.kind} · {formatWhen(m.created_at)}
                </p>
                <WhatsAppPreview body={m.body} sender={restaurant} simulated={m.simulated} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
