"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PartyPicker } from "@/components/booking/PartyPicker";
import { DayStrip, type DayState } from "@/components/booking/DayStrip";
import { TimeSlots } from "@/components/booking/TimeSlots";
import { BookingSuccess } from "@/components/booking/BookingSuccess";
import { WaitlistForm } from "@/components/booking/WaitlistForm";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Calendar } from "@/components/ui/Calendar";
import { ErrorState } from "@/components/ui/EmptyState";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  PeopleIcon,
  PhoneIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/components/icons";
import {
  formatDateFull,
  formatWeekdayDateShort,
  isoDateAddDays,
  nowTimeHHMM,
  shiftMonth,
  weekdayOf,
} from "@/lib/dates";
import { formatBRL, maskPhoneInput, normalizePhoneBR, peopleLabel, telHref, whatsappHref } from "@/lib/format";
import { closedReason, closedShiftNames } from "@/lib/hours";
import { friendlyErrorMessage, OCCASION_OPTIONS } from "@/lib/constants";
import { rememberPhone } from "@/lib/reservas";
import type { AvailableSlot, CreatedReservation, Occasion, PublicInfo } from "@/lib/types";

type Step = "party" | "date" | "time" | "details" | "review";
const STEP_ORDER: Step[] = ["party", "date", "time", "details", "review"];
const STEP_TITLE: Record<Step, string> = {
  party: "Quantas pessoas?",
  date: "Qual dia?",
  time: "Que horas?",
  details: "Seus dados",
  review: "Revise e confirme",
};

export type BookingPrefill = { name: string; phone: string; email: string };

type Keyed<T> = { key: string; data: T; error: string | null };

function useRpc<T>(key: string | null, run: () => PromiseLike<{ data: T | null; error: unknown }>) {
  const [result, setResult] = useState<Keyed<T | null> | null>(null);
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    runRef.current().then(({ data, error }) => {
      if (cancelled) return;
      setResult({ key, data: error ? null : data, error: error ? friendlyErrorMessage(error) : null });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  const loading = key !== null && result?.key !== key;
  return { loading, data: loading ? null : (result?.data ?? null), error: loading ? null : (result?.error ?? null) };
}

export function BookingFlow({
  info,
  prefill,
  initialParty,
  initialArea,
}: {
  info: PublicInfo;
  prefill: BookingPrefill | null;
  initialParty: number | null;
  initialArea: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const today = info.today;
  const lastDate = isoDateAddDays(today, info.max_advance_days);
  const allDays = useMemo(
    () => Array.from({ length: info.max_advance_days + 1 }, (_, i) => isoDateAddDays(today, i)),
    [today, info.max_advance_days]
  );

  // Hoje "encerrado": já passou do último horário de entrada (com a antecedência mínima).
  const todayEnded = useMemo(() => {
    const todays = info.shifts.filter((s) => s.weekday === weekdayOf(today));
    if (todays.length === 0) return false;
    const last = todays.map((s) => s.last_seating_time).sort().pop()!;
    const [h, m] = last.split(":").map(Number);
    const [nh, nm] = nowTimeHHMM().split(":").map(Number);
    return nh * 60 + nm + info.min_notice_minutes > h * 60 + m;
  }, [info.shifts, info.min_notice_minutes, today]);

  const isClosedDay = (date: string) =>
    closedReason(info, date) !== null || (date === today && todayEnded);

  const firstOpen = allDays.find((d) => !isClosedDay(d)) ?? today;

  const [step, setStep] = useState<Step>("party");
  const [party, setParty] = useState<number>(
    initialParty && initialParty >= 1 && initialParty <= info.max_party_online ? initialParty : 2
  );
  const [largeGroup, setLargeGroup] = useState(false);
  const [date, setDate] = useState(firstOpen);
  const [time, setTime] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(firstOpen);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // dados do formulário
  const [name, setName] = useState(prefill?.name ?? "");
  const [phone, setPhone] = useState(prefill?.phone ? maskPhoneInput(prefill.phone) : "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [notes, setNotes] = useState("");
  const [dietary, setDietary] = useState("");
  const [area, setArea] = useState<string>(
    initialArea && info.areas.some((a) => a.id === initialArea) ? initialArea : ""
  );
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [website, setWebsite] = useState(""); // campo-isca (honeypot)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedReservation | null>(null);

  const topRef = useRef<HTMLDivElement>(null);

  // Disponibilidade por dia (marca "lotado" na faixa). Máx. 31 dias por chamada.
  const daysAvail = useRpc<{ day: string; free_slots: number; closed: boolean }[]>(
    largeGroup ? null : `days|${party}|${refresh}`,
    () =>
      supabase.rpc("get_days_availability", {
        p_from: today,
        p_days: Math.min(31, info.max_advance_days + 1),
        p_party_size: party,
      })
  );
  const freeByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of daysAvail.data ?? []) map.set(d.day, d.free_slots);
    return map;
  }, [daysAvail.data]);

  const slotsRpc = useRpc<AvailableSlot[]>(largeGroup ? null : `slots|${date}|${party}|${refresh}`, () =>
    supabase.rpc("get_available_slots", { p_date: date, p_party_size: party })
  );
  const slots = slotsRpc.data ?? [];

  const stateOf = (d: string): DayState => {
    if (isClosedDay(d)) return "closed";
    if (freeByDay.get(d) === 0) return "full";
    return "open";
  };

  const fullDays = useMemo(() => {
    const set = new Set<string>();
    for (const [d, n] of freeByDay) if (n === 0) set.add(d);
    return set;
  }, [freeByDay]);

  // Próximas datas com vaga (sugestões quando o dia escolhido está lotado)
  const alternatives = (daysAvail.data ?? [])
    .filter((d) => d.day !== date && d.free_slots > 0 && !isClosedDay(d.day) && d.day >= today)
    .slice(0, 3)
    .map((d) => d.day);

  const shiftNotes = closedShiftNames(info, date);
  const depositApplies =
    info.deposit_enabled &&
    info.deposit_min_party !== null &&
    (info.deposit_per_person ?? 0) > 0 &&
    party >= info.deposit_min_party;
  const depositTotal = depositApplies ? party * (info.deposit_per_person ?? 0) : 0;
  const areaName = info.areas.find((a) => a.id === area)?.name ?? null;

  function scrollTop() {
    // no celular cada passo é uma "tela": volta pro topo do cartão
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function go(next: Step) {
    setStep(next);
    scrollTop();
  }

  function chooseParty(n: number) {
    setParty(n);
    setLargeGroup(false);
    setTime(null);
    setWaitlistOpen(false);
    go("date");
  }

  function chooseDate(d: string) {
    setDate(d);
    setTime(null);
    setWaitlistOpen(false);
    setCalendarOpen(false);
    go("time");
  }

  function chooseTime(t: string) {
    setTime(t);
    setSubmitError(null);
    go("details");
  }

  function back() {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) go(STEP_ORDER[i - 1]);
  }

  function validateDetails(): boolean {
    const errors: Record<string, string> = {};
    if (name.trim().length < 2) errors.name = "Informe seu nome.";
    if (!normalizePhoneBR(phone)) errors.phone = "Celular inválido. Use DDD + número.";
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) errors.email = "E-mail inválido.";
    if (!privacy) errors.privacy = "Para reservar, aceite a Política de Privacidade.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function toReview(e: React.FormEvent) {
    e.preventDefault();
    if (validateDetails()) go("review");
  }

  async function confirm() {
    if (!time || !validateDetails()) {
      go("details");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const { data, error } = await supabase.rpc("create_reservation_public", {
      p_date: date,
      p_start_time: time,
      p_party_size: party,
      p_name: name.trim(),
      p_phone: phone,
      p_email: email.trim() || null,
      p_occasion: occasion || null,
      p_notes: notes.trim() || null,
      p_area: area || null,
      p_marketing_consent: marketing,
      p_privacy_consent: privacy,
      p_dietary_notes: dietary.trim() || null,
      p_website: website || null,
    });
    setSubmitting(false);

    if (error || !data) {
      const message = friendlyErrorMessage(error);
      setSubmitError(message);
      if (error && "message" in error && /slot_taken|outside_hours|too_soon/.test(String(error.message))) {
        // o horário acabou de ser ocupado: volta para a escolha, já com a lista atualizada
        setTime(null);
        setRefresh((n) => n + 1);
        go("time");
      }
      return;
    }

    rememberPhone(data.code, phone);
    setCreated(data);
    scrollTop();
  }

  // --------------------------------------------------------------------------
  // Reserva feita
  // --------------------------------------------------------------------------
  if (created) {
    return (
      <div ref={topRef} className="scroll-mt-4">
        <BookingSuccess
          info={info}
          reservation={created}
          phone={phone}
          onChange={setCreated}
          onNew={() => {
            setCreated(null);
            setTime(null);
            setNotes("");
            setOccasion("");
            setDietary("");
            setRefresh((n) => n + 1);
            setStep("party");
          }}
        />
      </div>
    );
  }

  const stepIndex = STEP_ORDER.indexOf(step);
  const show = (s: Step) => (step === s ? "block" : "hidden lg:block");

  const contactLinks = (
    <div className="flex flex-wrap gap-2">
      {info.whatsapp && (
        <a
          href={whatsappHref(info.whatsapp, `Olá! Gostaria de reservar uma mesa para mais de ${info.max_party_online} pessoas.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("primary", "md")}
        >
          <WhatsAppIcon size={18} /> Falar no WhatsApp
        </a>
      )}
      {info.phone && (
        <a href={telHref(info.phone)} className={buttonClasses("secondary", "md")}>
          <PhoneIcon size={18} /> Ligar
        </a>
      )}
    </div>
  );

  // --------------------------------------------------------------------------
  // Fluxo: no celular, um passo por tela; no desktop, tudo visível (2 colunas)
  // --------------------------------------------------------------------------
  return (
    <div ref={topRef} className="scroll-mt-4">
      {/* Cabeçalho do passo (celular) */}
      <div className="mb-4 lg:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={back}
              className="-ml-2 flex min-h-tap items-center gap-1.5 rounded-full px-2 text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              <ArrowLeftIcon size={18} /> Voltar
            </button>
          ) : (
            <span />
          )}
          <span className="text-xs font-medium text-stone-500">
            Passo {stepIndex + 1} de {STEP_ORDER.length}
          </span>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEP_ORDER.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-brand" : "bg-stone-200"}`}
            />
          ))}
        </div>
        <h2 className="mt-4 font-serif text-[26px] font-bold leading-tight text-stone-900">
          {STEP_TITLE[step]}
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        {/* Coluna da esquerda: pessoas, data, horário */}
        <Card padding="none" className={`${["party", "date", "time"].includes(step) ? "block" : "hidden lg:block"} lg:divide-y lg:divide-stone-100`}>
          <section className={`${show("party")} p-4 sm:p-6`} aria-labelledby="sec-party">
            <SectionTitle id="sec-party" n={1} title="Pessoas" />
            <PartyPicker
              max={info.max_party_online}
              value={party}
              largeSelected={largeGroup}
              onSelect={chooseParty}
              onLargeGroup={() => {
                setLargeGroup(true);
                setTime(null);
              }}
            />
            {largeGroup && (
              <div className="mt-4 rounded-control border border-brand/20 bg-brand-soft p-4">
                <p className="text-sm font-semibold text-stone-900">Grupos grandes, atendimento especial</p>
                <p className="mb-3 mt-1 text-sm text-stone-600">
                  Para mais de {info.max_party_online} pessoas, a gente monta a mesa e o menu com você.
                  Fale com a nossa equipe:
                </p>
                {contactLinks}
              </div>
            )}
          </section>

          <section className={`${show("date")} p-4 sm:p-6 ${largeGroup ? "lg:pointer-events-none lg:opacity-40" : ""}`} aria-labelledby="sec-date">
            <SectionTitle
              id="sec-date"
              n={2}
              title="Data"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setCalendarMonth(date);
                    setCalendarOpen(true);
                  }}
                  className="flex min-h-tap items-center gap-1.5 rounded-full px-3 text-sm font-medium text-brand-ink hover:bg-brand-soft"
                >
                  <CalendarIcon size={16} /> Calendário
                </button>
              }
            />
            <DayStrip days={allDays} activeDate={date} stateOf={stateOf} onSelect={chooseDate} />
          </section>

          <section className={`${show("time")} p-4 sm:p-6 ${largeGroup ? "lg:pointer-events-none lg:opacity-40" : ""}`} aria-labelledby="sec-time">
            <SectionTitle id="sec-time" n={3} title="Horário" />
            <p className="-mt-2 mb-4 text-sm text-stone-500">
              {formatDateFull(date)} · {peopleLabel(party)}
            </p>
            {shiftNotes.length > 0 && (
              <p className="mb-4 rounded-control bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {shiftNotes.join(" e ")} fechado nesse dia para evento.
              </p>
            )}
            {slotsRpc.error ? (
              <ErrorState message={slotsRpc.error} onRetry={() => setRefresh((n) => n + 1)} />
            ) : !slotsRpc.loading && slots.length === 0 ? (
              waitlistOpen ? (
                <WaitlistForm
                  info={info}
                  date={date}
                  party={party}
                  prefill={{ name, phone, email }}
                  onCancel={() => setWaitlistOpen(false)}
                />
              ) : (
                <NoAvailability
                  date={date}
                  alternatives={alternatives}
                  waitlistEnabled={info.waitlist_enabled}
                  onPickDate={chooseDate}
                  onWaitlist={() => setWaitlistOpen(true)}
                />
              )
            ) : (
              <TimeSlots slots={slots} loading={slotsRpc.loading} selected={time} onSelect={chooseTime} />
            )}
          </section>
        </Card>

        {/* Coluna da direita: resumo, dados e confirmação */}
        <div className={`${["details", "review"].includes(step) ? "block" : "hidden lg:block"} lg:sticky lg:top-6`}>
          <Card padding="none">
            <div className="hidden border-b border-stone-100 px-6 py-5 lg:block">
              <h2 className="font-serif text-xl font-bold text-stone-900">Sua reserva</h2>
              <Summary date={date} time={time} party={party} areaName={areaName} />
            </div>

            {!time || largeGroup ? (
              <p className="hidden px-6 py-6 text-sm text-stone-500 lg:block">
                Escolha o número de pessoas, a data e um horário para continuar.
              </p>
            ) : step === "review" ? (
              <Review
                info={info}
                date={date}
                time={time}
                party={party}
                areaName={areaName}
                name={name}
                phone={phone}
                email={email}
                occasion={occasion}
                notes={notes}
                dietary={dietary}
                depositTotal={depositTotal}
                submitting={submitting}
                error={submitError}
                onEdit={() => go("details")}
                onConfirm={confirm}
              />
            ) : (
              <form onSubmit={toReview} className="flex flex-col gap-4 p-4 sm:p-6" noValidate>
                <div className="lg:hidden">
                  <Summary date={date} time={time} party={party} areaName={areaName} compact />
                </div>
                {submitError && (
                  <p role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </p>
                )}
                <Input
                  id="name"
                  label="Nome completo"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={fieldErrors.name}
                />
                <Input
                  id="phone"
                  label="Celular (WhatsApp)"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="(11) 98888-7777"
                  value={phone}
                  onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
                  error={fieldErrors.phone}
                  hint="Enviamos a confirmação e os lembretes por aqui."
                />
                <Input
                  id="email"
                  label="E-mail (opcional)"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                />
                <Select id="occasion" label="Ocasião (opcional)" value={occasion} onChange={(e) => setOccasion(e.target.value as Occasion | "")}>
                  <option value="">Nenhuma em especial</option>
                  {OCCASION_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                {info.areas.length > 1 && (
                  <fieldset>
                    <legend className="mb-2 px-1 text-sm font-medium text-stone-600">Preferência de área</legend>
                    <div className="flex flex-wrap gap-2">
                      {[{ id: "", name: "Sem preferência" }, ...info.areas].map((a) => (
                        <button
                          key={a.id || "none"}
                          type="button"
                          aria-pressed={area === a.id}
                          onClick={() => setArea(a.id)}
                          className={`min-h-tap rounded-full border px-4 text-sm font-medium transition-colors ${
                            area === a.id
                              ? "border-brand bg-brand text-brand-contrast"
                              : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 px-1 text-xs text-stone-500">Atendemos a preferência sempre que houver mesa.</p>
                  </fieldset>
                )}
                <Input
                  id="dietary"
                  label="Alergias ou restrições alimentares (opcional)"
                  placeholder="Ex.: alergia a frutos do mar, sem glúten"
                  value={dietary}
                  maxLength={300}
                  onChange={(e) => setDietary(e.target.value)}
                />
                <Textarea
                  id="notes"
                  label="Observações (opcional)"
                  placeholder="Cadeirinha para bebê, acessibilidade, um pedido especial..."
                  value={notes}
                  maxLength={500}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {/* Campo-isca para robôs: invisível para pessoas e leitores de tela */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  <label htmlFor="website">Site</label>
                  <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 rounded-control bg-stone-50 px-3 py-2">
                  <Checkbox
                    id="privacy"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                    label={
                      <>
                        Li e aceito a{" "}
                        <Link href="/privacidade" target="_blank" className="font-medium text-brand-ink underline">
                          Política de Privacidade
                        </Link>{" "}
                        e autorizo o uso dos meus dados — inclusive alergias, se eu informar — para atender esta reserva.
                      </>
                    }
                  />
                  {fieldErrors.privacy && <p className="px-8 text-sm text-red-600">{fieldErrors.privacy}</p>}
                  <Checkbox
                    id="marketing"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    label={`Quero receber novidades e convites do ${info.name} (opcional).`}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Revisar reserva <ArrowRightIcon size={18} />
                </Button>
              </form>
            )}
          </Card>
          <div className="mt-4 hidden lg:block">
            <Policy info={info} />
          </div>
        </div>
      </div>

      <Modal open={calendarOpen} onClose={() => setCalendarOpen(false)} title="Escolha a data">
        <Calendar
          month={calendarMonth}
          selected={date}
          today={today}
          minDate={today}
          maxDate={lastDate}
          closed={isClosedDay}
          full={fullDays}
          onSelect={chooseDate}
          onMonthChange={(delta) => setCalendarMonth((m) => shiftMonth(m, delta))}
        />
      </Modal>
    </div>
  );
}

function SectionTitle({ id, n, title, action }: { id: string; n: number; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 hidden items-center justify-between gap-3 lg:flex">
      <h2 id={id} className="flex items-center gap-3 text-lg font-semibold text-stone-900">
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-contrast">
          {n}
        </span>
        {title}
      </h2>
      {action}
    </div>
  );
}

function Summary({
  date,
  time,
  party,
  areaName,
  compact = false,
}: {
  date: string;
  time: string | null;
  party: number;
  areaName: string | null;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? "rounded-control bg-brand-soft px-3 py-2.5" : "mt-3"} flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-stone-700`}>
      <span className="flex items-center gap-1.5">
        <CalendarIcon size={16} className="text-brand-ink" /> {formatWeekdayDateShort(date)}
      </span>
      <span className="flex items-center gap-1.5">
        <ClockIcon size={16} className="text-brand-ink" /> {time ?? "—"}
      </span>
      <span className="flex items-center gap-1.5">
        <PeopleIcon size={16} className="text-brand-ink" /> {peopleLabel(party)}
      </span>
      {areaName && (
        <span className="flex items-center gap-1.5">
          <PinIcon size={16} className="text-brand-ink" /> {areaName}
        </span>
      )}
    </div>
  );
}

function Policy({ info }: { info: PublicInfo }) {
  return (
    <div className="rounded-card border border-stone-200 bg-white/70 px-5 py-4 text-sm text-stone-600">
      <p className="font-semibold text-stone-800">Como funciona</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Você pode alterar ou cancelar sem custo até{" "}
          <strong>
            {info.cancel_deadline_hours} {info.cancel_deadline_hours === 1 ? "hora" : "horas"} antes
          </strong>
          , pelo link que você recebe na confirmação.
        </li>
        <li>Seguramos a mesa por {info.grace_minutes} minutos após o horário marcado.</li>
        {info.deposit_enabled && info.deposit_min_party && info.deposit_per_person ? (
          <li>
            Grupos a partir de {info.deposit_min_party} pessoas pagam um sinal de{" "}
            {formatBRL(info.deposit_per_person)} por pessoa, descontado da conta.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function Review({
  info,
  date,
  time,
  party,
  areaName,
  name,
  phone,
  email,
  occasion,
  notes,
  dietary,
  depositTotal,
  submitting,
  error,
  onEdit,
  onConfirm,
}: {
  info: PublicInfo;
  date: string;
  time: string;
  party: number;
  areaName: string | null;
  name: string;
  phone: string;
  email: string;
  occasion: Occasion | "";
  notes: string;
  dietary: string;
  depositTotal: number;
  submitting: boolean;
  error: string | null;
  onEdit: () => void;
  onConfirm: () => void;
}) {
  const occasionLabel = OCCASION_OPTIONS.find((o) => o.key === occasion)?.label;
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="rounded-control bg-brand-soft p-4">
        <p className="font-serif text-lg font-bold text-stone-900">{info.name}</p>
        <p className="mt-1 text-sm text-stone-700">{formatDateFull(date)}</p>
        <p className="text-sm text-stone-700">
          {time} · {peopleLabel(party)}
          {areaName ? ` · preferência: ${areaName}` : ""}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-stone-500">Nome</dt>
        <dd className="font-medium text-stone-900">{name}</dd>
        <dt className="text-stone-500">Celular</dt>
        <dd className="font-medium text-stone-900">{phone}</dd>
        {email && (
          <>
            <dt className="text-stone-500">E-mail</dt>
            <dd className="break-all font-medium text-stone-900">{email}</dd>
          </>
        )}
        {occasionLabel && (
          <>
            <dt className="text-stone-500">Ocasião</dt>
            <dd className="font-medium text-stone-900">{occasionLabel}</dd>
          </>
        )}
        {dietary && (
          <>
            <dt className="text-stone-500">Alergias</dt>
            <dd className="font-medium text-stone-900">{dietary}</dd>
          </>
        )}
        {notes && (
          <>
            <dt className="text-stone-500">Observações</dt>
            <dd className="text-stone-900">{notes}</dd>
          </>
        )}
      </dl>

      {depositTotal > 0 && (
        <div className="rounded-control border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Sinal de {formatBRL(depositTotal)} para garantir a mesa</p>
          <p className="mt-1">
            Para grupos a partir de {info.deposit_min_party} pessoas pedimos um sinal de{" "}
            {formatBRL(info.deposit_per_person ?? 0)} por pessoa, descontado da conta. Você paga no
            próximo passo{info.demo_mode ? " (pagamento simulado na demonstração)" : ""}.
          </p>
        </div>
      )}

      <p className="text-xs text-stone-500">
        Ao confirmar, você recebe o código da reserva. Alterações e cancelamentos sem custo até{" "}
        {info.cancel_deadline_hours} {info.cancel_deadline_hours === 1 ? "hora" : "horas"} antes; seguramos a
        mesa por {info.grace_minutes} minutos após o horário.
      </p>

      {error && (
        <p role="alert" className="rounded-control bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onConfirm} disabled={submitting}>
          {submitting ? "Confirmando..." : depositTotal > 0 ? "Confirmar e ir para o sinal" : "Confirmar reserva"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onEdit} disabled={submitting}>
          Editar meus dados
        </Button>
      </div>
    </div>
  );
}

function NoAvailability({
  date,
  alternatives,
  waitlistEnabled,
  onPickDate,
  onWaitlist,
}: {
  date: string;
  alternatives: string[];
  waitlistEnabled: boolean;
  onPickDate: (d: string) => void;
  onWaitlist: () => void;
}) {
  return (
    <div className="rounded-control border border-stone-200 bg-stone-50 p-4">
      <p className="font-semibold text-stone-900">Esse dia está lotado para esse grupo</p>
      <p className="mt-1 text-sm text-stone-600">
        Não há mais mesas livres em {formatWeekdayDateShort(date).toLowerCase()}. Veja outras datas
        {waitlistEnabled ? " ou entre na lista de espera — avisamos se abrir uma vaga." : "."}
      </p>
      {alternatives.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {alternatives.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onPickDate(d)}
              className="min-h-tap rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 hover:border-brand hover:text-brand-ink"
            >
              {formatWeekdayDateShort(d)}
            </button>
          ))}
        </div>
      )}
      {waitlistEnabled && (
        <Button variant="secondary" className="mt-4 w-full sm:w-auto" onClick={onWaitlist}>
          Entrar na lista de espera
        </Button>
      )}
    </div>
  );
}
