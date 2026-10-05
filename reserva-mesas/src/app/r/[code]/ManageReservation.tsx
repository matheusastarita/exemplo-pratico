"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { SimulatedBadge } from "@/components/DemoNotice";
import { DayStrip } from "@/components/booking/DayStrip";
import { TimeSlots } from "@/components/booking/TimeSlots";
import {
  CalendarIcon,
  CalendarPlusIcon,
  CheckCircleIcon,
  ClockIcon,
  PeopleIcon,
  PhoneIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { formatDateFull, isoDateAddDays } from "@/lib/dates";
import { formatBRL, maskPhoneInput, normalizePhoneBR, peopleLabel, telHref, whatsappHref } from "@/lib/format";
import { friendlyErrorMessage, OCCASION_LABEL } from "@/lib/constants";
import { closedReason } from "@/lib/hours";
import { customerStatusLabel, manageUrl, recallPhone, rememberPhone } from "@/lib/reservas";
import { downloadICS } from "@/lib/calendar";
import type { AvailableSlot, PublicInfo, PublicReservation } from "@/lib/types";

const CANCEL_REASONS = ["Mudança de planos", "Imprevisto", "Vou reservar outro dia", "Outro motivo"];

const noopSubscribe = () => () => {};

export function ManageReservation({ info, code }: { info: PublicInfo; code: string }) {
  const supabase = useMemo(() => createClient(), []);
  // Telefone guardado nesta aba logo após reservar (undefined = ainda hidratando).
  const savedPhone = useSyncExternalStore(noopSubscribe, () => recallPhone(code), () => undefined);
  const [phone, setPhone] = useState("");
  const [reservation, setReservation] = useState<PublicReservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoDone, setAutoDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [changeOpen, setChangeOpen] = useState(false);

  // Abre direto quando o telefone já está guardado.
  useEffect(() => {
    if (!savedPhone) return;
    let cancelled = false;
    supabase.rpc("get_reservation_public", { p_code: code, p_phone: savedPhone }).then(({ data, error: rpcError }) => {
      if (cancelled) return;
      setPhone(maskPhoneInput(savedPhone));
      if (data && !rpcError) setReservation(data);
      setAutoDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [savedPhone, code, supabase]);

  async function load(withPhone: string) {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("get_reservation_public", {
      p_code: code,
      p_phone: withPhone,
    });
    setLoading(false);
    if (rpcError || !data) {
      setError(friendlyErrorMessage(rpcError));
      return;
    }
    rememberPhone(code, withPhone);
    setReservation(data);
  }

  async function act(
    kind: "confirm" | "cancel" | "pay",
    run: () => PromiseLike<{ data: PublicReservation | null; error: unknown }>,
    success: string
  ) {
    setBusy(kind);
    setError(null);
    setNotice(null);
    const { data, error: rpcError } = await run();
    setBusy(null);
    if (rpcError || !data) {
      setError(friendlyErrorMessage(rpcError));
      return;
    }
    setReservation(data);
    setNotice(success);
  }

  function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!normalizePhoneBR(phone)) {
      setError("Celular inválido. Use DDD + número.");
      return;
    }
    void load(phone);
  }

  const contact = (
    <div className="flex flex-wrap gap-2">
      {info.whatsapp && (
        <a
          href={whatsappHref(info.whatsapp, `Olá! Preciso de ajuda com a reserva ${code}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("secondary", "md")}
        >
          <WhatsAppIcon size={18} /> WhatsApp
        </a>
      )}
      {info.phone && (
        <a href={telHref(info.phone)} className={buttonClasses("secondary", "md")}>
          <PhoneIcon size={18} /> Ligar
        </a>
      )}
    </div>
  );

  if (savedPhone === undefined || (savedPhone && !autoDone) || (loading && !reservation)) {
    return (
      <Card className="mx-auto max-w-xl" role="status" aria-label="Carregando reserva">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-4 w-64" />
        <Skeleton className="mt-2 h-4 w-52" />
        <Skeleton className="mt-6 h-11 w-full rounded-full" />
      </Card>
    );
  }

  if (!reservation) {
    return (
      <Card className="mx-auto max-w-xl">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Sua reserva</h1>
        <p className="mt-1 text-sm text-stone-600">
          Código <span className="font-mono font-semibold tracking-wider text-stone-900">{code}</span>. Para
          proteger seus dados, confirme o celular usado na reserva.
        </p>
        <form onSubmit={unlock} className="mt-5 flex flex-col gap-4">
          <Input
            id="phone"
            label="Celular"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(11) 98888-7777"
            value={phone}
            onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
            error={error ?? undefined}
          />
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Buscando..." : "Ver minha reserva"}
          </Button>
        </form>
      </Card>
    );
  }

  const r = reservation;
  const upcoming = r.minutes_until > 0;
  const active = r.status === "pending" || r.status === "confirmed";
  const lateToChange = active && upcoming && !r.can_change;
  const [h1, m1] = r.start_time.split(":").map(Number);
  const [h2, m2] = r.end_time.split(":").map(Number);
  const duration = (h2 * 60 + m2 - (h1 * 60 + m1) + 1440) % 1440 || 90;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Reserva {r.code}</p>
            <h1 className="mt-1 font-serif text-[26px] font-bold leading-tight text-stone-900">
              {r.customer_name.split(" ")[0]}, {active && upcoming ? "sua mesa está reservada" : "sua reserva"}
            </h1>
          </div>
          <Badge tone={r.status} size="md">
            {customerStatusLabel(r.status)}
          </Badge>
        </div>

        <ul className="mt-5 space-y-2.5 text-[15px] text-stone-800">
          <li className="flex items-center gap-3">
            <CalendarIcon size={18} className="shrink-0 text-brand-ink" /> {formatDateFull(r.date)}
          </li>
          <li className="flex items-center gap-3">
            <ClockIcon size={18} className="shrink-0 text-brand-ink" /> {r.start_time}
          </li>
          <li className="flex items-center gap-3">
            <PeopleIcon size={18} className="shrink-0 text-brand-ink" /> {peopleLabel(r.party_size)}
            {r.occasion ? ` · ${OCCASION_LABEL[r.occasion]}` : ""}
          </li>
          {r.area_name && (
            <li className="flex items-center gap-3">
              <PinIcon size={18} className="shrink-0 text-brand-ink" /> {r.area_name}
            </li>
          )}
        </ul>

        {(r.notes || r.dietary_notes) && (
          <div className="mt-4 rounded-control bg-stone-50 px-4 py-3 text-sm text-stone-700">
            {r.dietary_notes && (
              <p>
                <span className="font-medium">Alergias/restrições:</span> {r.dietary_notes}
              </p>
            )}
            {r.notes && (
              <p className={r.dietary_notes ? "mt-1" : ""}>
                <span className="font-medium">Observações:</span> {r.notes}
              </p>
            )}
          </div>
        )}

        {r.confirmed_by_customer_at && active && (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-status-confirmed">
            <CheckCircleIcon size={18} /> Presença confirmada. Até lá!
          </p>
        )}

        {notice && (
          <p role="status" className="mt-4 rounded-control bg-status-confirmed-bg px-3 py-2 text-sm text-status-confirmed">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {r.status === "pending" && r.deposit_status === "pending" && (
          <div className="mt-5 rounded-control border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-amber-800">
                Falta o sinal de {formatBRL(Number(r.deposit_amount ?? 0))} para garantir a mesa
              </p>
              {info.demo_mode && <SimulatedBadge label="Demonstração" />}
            </div>
            {info.demo_mode && (
              <Button
                className="mt-3 w-full"
                disabled={busy !== null}
                onClick={() =>
                  act("pay", () => supabase.rpc("pay_deposit_public", { p_code: code, p_phone: phone }), "Sinal pago. Reserva confirmada!")
                }
              >
                {busy === "pay" ? "Processando..." : "Pagar sinal com PIX (simulado)"}
              </Button>
            )}
          </div>
        )}

        {active && upcoming && r.can_change && (
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {!r.confirmed_by_customer_at && (
              <Button
                className="sm:col-span-2"
                size="lg"
                disabled={busy !== null}
                onClick={() =>
                  act(
                    "confirm",
                    () => supabase.rpc("confirm_presence_public", { p_code: code, p_phone: phone }),
                    "Presença confirmada. Obrigado por avisar!"
                  )
                }
              >
                {busy === "confirm" ? "Confirmando..." : "Confirmar presença"}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setChangeOpen(true)} disabled={busy !== null}>
              Alterar reserva
            </Button>
            <Button variant="danger" onClick={() => setCancelOpen(true)} disabled={busy !== null}>
              Cancelar reserva
            </Button>
          </div>
        )}

        {lateToChange && (
          <div className="mt-6 rounded-control border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-stone-900">
              Faltam menos de {r.cancel_deadline_hours} {r.cancel_deadline_hours === 1 ? "hora" : "horas"} para a
              reserva
            </p>
            <p className="mb-3 mt-1 text-sm text-stone-600">
              Pelo site, alterações e cancelamentos vão até {r.cancel_deadline_hours}{" "}
              {r.cancel_deadline_hours === 1 ? "hora" : "horas"} antes. Para mudar algo agora, fale com o
              restaurante:
            </p>
            {contact}
          </div>
        )}

        {r.status === "cancelled" && (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-stone-600">Essa reserva foi cancelada. Que tal escolher outro dia?</p>
            <Link href={`/reservar?pessoas=${r.party_size}`} className={buttonClasses("primary", "lg")}>
              Fazer nova reserva
            </Link>
          </div>
        )}

        {(r.status === "completed" || r.status === "no_show" || (!upcoming && active)) && r.status !== "cancelled" && (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-stone-600">
              {r.status === "completed" ? "Obrigado pela visita! Volte sempre." : "Essa data já passou."}
            </p>
            <Link href={`/reservar?pessoas=${r.party_size}`} className={buttonClasses("primary", "lg")}>
              Reservar de novo
            </Link>
          </div>
        )}

        {active && upcoming && (
          <Button
            variant="ghost"
            className="mt-3 w-full"
            onClick={() =>
              downloadICS({
                code: r.code,
                restaurantName: info.name,
                address: info.address,
                partySize: r.party_size,
                date: r.date,
                startTime: r.start_time,
                durationMinutes: duration,
                manageUrl: manageUrl(window.location.origin, r.code),
              })
            }
          >
            <CalendarPlusIcon size={18} /> Adicionar ao calendário
          </Button>
        )}
      </Card>

      <Card padding="sm" className="text-sm text-stone-600">
        <p className="font-semibold text-stone-900">{info.name}</p>
        {info.address && <p className="mt-0.5">{info.address}</p>}
        <div className="mt-3">{contact}</div>
      </Card>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancelar reserva?"
        description={`${formatDateFull(r.date)} às ${r.start_time} · ${peopleLabel(r.party_size)}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={busy !== null}>
              Manter reserva
            </Button>
            <Button
              variant="danger"
              disabled={busy !== null}
              onClick={async () => {
                await act(
                  "cancel",
                  () =>
                    supabase.rpc("cancel_reservation_public", {
                      p_code: code,
                      p_phone: phone,
                      p_reason: cancelReason,
                    }),
                  "Reserva cancelada. A mesa foi liberada."
                );
                setCancelOpen(false);
              }}
            >
              {busy === "cancel" ? "Cancelando..." : "Sim, cancelar"}
            </Button>
          </>
        }
      >
        <Select id="cancel-reason" label="Motivo (opcional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
          {CANCEL_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </Select>
        <p className="mt-3 text-sm text-stone-500">Avisamos a lista de espera — alguém pode aproveitar a mesa.</p>
      </Modal>

      {changeOpen && (
        <ChangeReservation
          info={info}
          code={code}
          phone={phone}
          reservation={r}
          onClose={() => setChangeOpen(false)}
          onChanged={(updated) => {
            setReservation(updated);
            setNotice("Reserva alterada. Enviamos a confirmação com os novos dados.");
            setChangeOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ChangeReservation({
  info,
  code,
  phone,
  reservation,
  onClose,
  onChanged,
}: {
  info: PublicInfo;
  code: string;
  phone: string;
  reservation: PublicReservation;
  onClose: () => void;
  onChanged: (r: PublicReservation) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const days = useMemo(
    () => Array.from({ length: info.max_advance_days + 1 }, (_, i) => isoDateAddDays(info.today, i)),
    [info.today, info.max_advance_days]
  );
  const [party, setParty] = useState(reservation.party_size);
  const [date, setDate] = useState(reservation.date);
  const [time, setTime] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; slots: AvailableSlot[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = `${date}|${party}`;

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc("get_available_slots_for_change", { p_code: code, p_phone: phone, p_date: date, p_party_size: party })
      .then(({ data }) => {
        if (!cancelled) setResult({ key: `${date}|${party}`, slots: data ?? [] });
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, code, phone, date, party]);

  const loading = result?.key !== key;
  const slots = loading ? [] : result!.slots;

  async function save() {
    if (!time) return;
    setSaving(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("change_reservation_public", {
      p_code: code,
      p_phone: phone,
      p_new_date: date,
      p_new_time: time,
      p_party_size: party,
    });
    setSaving(false);
    if (rpcError || !data) {
      setError(friendlyErrorMessage(rpcError));
      return;
    }
    onChanged(data);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Alterar reserva"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Voltar
          </Button>
          <Button onClick={save} disabled={!time || saving}>
            {saving ? "Salvando..." : time ? `Mudar para ${time}` : "Escolha um horário"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Select
          id="change-party"
          label="Pessoas"
          value={party}
          onChange={(e) => {
            setParty(Number(e.target.value));
            setTime(null);
          }}
        >
          {Array.from({ length: info.max_party_online }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {peopleLabel(n)}
            </option>
          ))}
        </Select>
        <div>
          <p className="mb-2 px-1 text-sm font-medium text-stone-600">Data</p>
          <DayStrip
            days={days}
            activeDate={date}
            stateOf={(d) => (closedReason(info, d) ? "closed" : "open")}
            onSelect={(d) => {
              setDate(d);
              setTime(null);
            }}
          />
        </div>
        <div>
          <p className="mb-2 px-1 text-sm font-medium text-stone-600">Novo horário</p>
          {!loading && slots.length === 0 ? (
            <p className="rounded-control bg-stone-50 px-4 py-4 text-sm text-stone-600">
              Não há mesa para {peopleLabel(party)} nesse dia. Tente outra data.
            </p>
          ) : (
            <TimeSlots slots={slots} loading={loading} selected={time} onSelect={setTime} />
          )}
        </div>
        {error && (
          <p role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
