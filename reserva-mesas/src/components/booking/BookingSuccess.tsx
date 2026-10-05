"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WhatsAppPreview } from "@/components/WhatsAppPreview";
import { SimulatedBadge } from "@/components/DemoNotice";
import { CalendarPlusIcon, CheckIcon, ShareIcon } from "@/components/icons";
import { downloadICS } from "@/lib/calendar";
import { formatDateFull } from "@/lib/dates";
import { formatBRL, peopleLabel } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/constants";
import { manageUrl } from "@/lib/reservas";
import type { CreatedReservation, PublicInfo } from "@/lib/types";

/** Tela de "Reserva confirmada": código, resumo, calendário, compartilhar e gerenciar. */
export function BookingSuccess({
  info,
  reservation,
  phone,
  onChange,
  onNew,
}: {
  info: PublicInfo;
  reservation: CreatedReservation;
  phone: string;
  onChange: (r: CreatedReservation) => void;
  onNew: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const pending = reservation.status === "pending";
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = manageUrl(origin, reservation.code);
  const [h1, m1] = reservation.start_time.split(":").map(Number);
  const [h2, m2] = reservation.end_time.split(":").map(Number);
  const duration = (h2 * 60 + m2 - (h1 * 60 + m1) + 1440) % 1440 || 90;

  const shareText =
    `Reserva no ${info.name}: ${formatDateFull(reservation.date)} às ${reservation.start_time}, ` +
    `${peopleLabel(reservation.party_size)}. Código ${reservation.code}.` +
    (info.address ? ` ${info.address}` : "");

  async function payDeposit() {
    setPaying(true);
    setPayError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("pay_deposit_public", {
      p_code: reservation.code,
      p_phone: phone,
    });
    setPaying(false);
    if (error || !data) {
      setPayError(friendlyErrorMessage(error));
      return;
    }
    onChange({ ...reservation, status: data.status });
  }

  return (
    <Card className="mx-auto max-w-2xl text-center sm:p-8">
      <span
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          pending ? "bg-amber-50 text-amber-700" : "bg-status-confirmed-bg text-status-confirmed"
        }`}
      >
        <CheckIcon size={30} />
      </span>
      <h2 className="mt-5 font-serif text-[28px] font-bold leading-tight text-stone-900">
        {pending ? "Falta só o sinal" : "Reserva confirmada!"}
      </h2>
      <p className="mt-2 text-stone-600">
        {formatDateFull(reservation.date)} às <strong>{reservation.start_time}</strong> ·{" "}
        {peopleLabel(reservation.party_size)}
        {reservation.area_name ? ` · ${reservation.area_name}` : ""}
      </p>

      <div className="mx-auto mt-6 max-w-xs rounded-card border border-dashed border-brand/40 bg-brand-soft px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-600">Código da reserva</p>
        <p className="mt-1 font-mono text-[28px] font-bold tracking-[0.18em] text-brand-ink">{reservation.code}</p>
        <p className="mt-1 text-xs text-stone-600">Use com seu celular para ver, alterar ou cancelar.</p>
      </div>

      {!reservation.area_matched && (
        <p className="mx-auto mt-4 max-w-md text-sm text-stone-600">
          Não havia mesa livre na área que você preferiu nesse horário, então reservamos em{" "}
          {reservation.area_name}.
        </p>
      )}

      {pending && reservation.deposit_amount && (
        <div className="mx-auto mt-6 max-w-md rounded-card border border-amber-100 bg-amber-50 p-5 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-amber-800">Sinal de {formatBRL(Number(reservation.deposit_amount))}</p>
              <p className="mt-1 text-sm text-amber-800">
                A mesa do grupo fica garantida depois do pagamento. O valor é descontado da conta.
              </p>
            </div>
            {info.demo_mode && <SimulatedBadge label="Demonstração" />}
          </div>
          {info.demo_mode ? (
            <Button className="mt-4 w-full" onClick={payDeposit} disabled={paying}>
              {paying ? "Processando..." : "Pagar sinal com PIX (simulado)"}
            </Button>
          ) : (
            <p className="mt-3 text-sm text-amber-800">Enviamos as instruções de pagamento pelo WhatsApp.</p>
          )}
          {payError && <p className="mt-2 text-sm text-red-600">{payError}</p>}
        </div>
      )}

      <div className="mx-auto mt-6 grid max-w-md gap-2.5 sm:grid-cols-2">
        <Button
          variant="secondary"
          onClick={() =>
            downloadICS({
              code: reservation.code,
              restaurantName: info.name,
              address: info.address,
              partySize: reservation.party_size,
              date: reservation.date,
              startTime: reservation.start_time,
              durationMinutes: duration,
              manageUrl: link,
            })
          }
        >
          <CalendarPlusIcon size={18} /> Adicionar ao calendário
        </Button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("secondary", "md")}
        >
          <ShareIcon size={18} /> Compartilhar
        </a>
        <Link href={`/r/${reservation.code}`} className={buttonClasses("primary", "md", "sm:col-span-2")}>
          Ver, alterar ou cancelar
        </Link>
      </div>

      {info.demo_mode && reservation.message && !pending && (
        <div className="mx-auto mt-8 max-w-md">
          <p className="mb-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
            Mensagem que o cliente recebe
          </p>
          <WhatsAppPreview body={reservation.message} sender={info.name} />
        </div>
      )}

      <button
        type="button"
        onClick={onNew}
        className="mt-6 min-h-tap text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
      >
        Fazer outra reserva
      </button>
    </Card>
  );
}
