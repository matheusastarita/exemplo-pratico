"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { WhatsAppPreview } from "@/components/WhatsAppPreview";
import { friendlyErrorMessage } from "@/lib/constants";
import { firstName, formatPhone } from "@/lib/format";
import type { HostReservation } from "@/lib/types";

function quickTexts(r: HostReservation, restaurant: string) {
  const name = firstName(r.customer.full_name);
  return [
    `Oi, ${name}! Sua mesa no ${restaurant} já está pronta. Estamos te esperando!`,
    `Oi, ${name}, tudo bem? Sua reserva era às ${r.start_time}. Vai conseguir vir? Seguramos a mesa por mais alguns minutos.`,
    `${name}, obrigado pela visita ao ${restaurant}! Esperamos ver você de novo em breve.`,
  ];
}

/** Mensagem avulsa para o cliente — registrada como simulada na demonstração. */
export function MessageDialog({
  reservation,
  restaurant,
  onClose,
  onSent,
}: {
  reservation: HostReservation | null;
  restaurant: string;
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!reservation) return null;
  const texts = quickTexts(reservation, restaurant);

  async function send() {
    if (!reservation) return;
    setSending(true);
    setError(null);
    const { error: rpcError } = await createClient().rpc("send_manual_message", {
      p_reservation_id: reservation.id,
      p_body: body,
    });
    setSending(false);
    if (rpcError) return setError(friendlyErrorMessage(rpcError));
    onSent(`Mensagem para ${firstName(reservation.customer.full_name)} registrada (envio simulado).`);
    setBody("");
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Mensagem para ${reservation.customer.full_name}`}
      description={formatPhone(reservation.customer.phone)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={send} disabled={sending || body.trim().length < 2}>
            {sending ? "Enviando..." : "Enviar (simulado)"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {texts.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setBody(t)}
              className="rounded-control border border-stone-200 bg-white px-3 py-2.5 text-left text-sm text-stone-700 hover:border-brand hover:bg-brand-soft"
            >
              {t}
            </button>
          ))}
        </div>
        <Textarea id="msg-body" label="Mensagem" rows={3} value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} />
        {body.trim() && <WhatsAppPreview body={body} sender={restaurant} />}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
