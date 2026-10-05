"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Toast, type ToastData } from "@/components/ui/Toast";
import { ReservationCard, type CardActions } from "@/components/salao/ReservationCard";
import { TableMap } from "@/components/salao/TableMap";
import { TablePicker } from "@/components/salao/TablePicker";
import { WaitlistPanel } from "@/components/salao/WaitlistPanel";
import { WalkInDialog } from "@/components/salao/WalkInDialog";
import { NewReservationDialog } from "@/components/salao/NewReservationDialog";
import { MessageDialog } from "@/components/salao/MessageDialog";
import { ReservationDetailsDialog } from "@/components/salao/ReservationDetailsDialog";
import { TableDialog } from "@/components/salao/TableDialog";
import { CalendarIcon, ChevronIcon, PlusIcon, WalkInIcon } from "@/components/icons";
import { dateTimeToUtcMillis, formatDateHeading, formatWeekdayDateShort, isoDateAddDays, nowTimeHHMM } from "@/lib/dates";
import { friendlyErrorMessage, STAFF_ERROR_MESSAGES } from "@/lib/constants";
import { firstName, peopleLabel } from "@/lib/format";
import {
  currentShift,
  displayStatusOf,
  matchesQuery,
  summarizeDay,
  tableLabels,
  tableStatuses,
  type DisplayStatus,
} from "@/lib/salao";
import type { HostDay, HostReservation, HostTable, HostWaitlistEntry } from "@/lib/types";

type Tab = "linha" | "mapa" | "fila";
type SeatMode = { reservation: HostReservation; mode: "seat" | "move" } | { waitlist: HostWaitlistEntry; mode: "waitlist" };

function serverNowMillis(day: HostDay) {
  const [d, t] = day.now.split("T");
  return dateTimeToUtcMillis(d, t.slice(0, 5));
}

const CANCEL_REASONS = ["Cliente pediu para cancelar", "Cliente não confirmou", "Restaurante não pôde atender", "Outro motivo"];

export function SalaoView({ initial, today }: { initial: HostDay; today: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [date, setDate] = useState(initial.date);
  const [state, setState] = useState<{ date: string; day: HostDay; error: string | null }>({
    date: initial.date,
    day: initial,
    error: null,
  });
  const [now, setNow] = useState(() => serverNowMillis(initial));
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState<Tab>("linha");
  const [leftTab, setLeftTab] = useState<"linha" | "fila">("linha");
  const [area, setArea] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showEnded, setShowEnded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [seat, setSeat] = useState<SeatMode | null>(null);
  const [seatIds, setSeatIds] = useState<string[]>([]);
  const [walkIn, setWalkIn] = useState<{ open: boolean; tableId: string | null }>({ open: false, tableId: null });
  const [newOpen, setNewOpen] = useState(false);
  const [messageFor, setMessageFor] = useState<HostReservation | null>(null);
  const [detailsFor, setDetailsFor] = useState<HostReservation | null>(null);
  const [tableFor, setTableFor] = useState<HostTable | null>(null);
  const [cancelFor, setCancelFor] = useState<HostReservation | null>(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);

  const dateRef = useRef(date);
  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  const loading = state.date !== date;
  const day = state.day;
  const isToday = state.date === today;

  // Reservas já conhecidas do dia na tela: o que aparecer de novo pelo site vira aviso
  const knownRef = useRef<{ date: string; ids: Set<string> } | null>(null);
  useEffect(() => {
    knownRef.current = { date: state.date, ids: new Set(state.day.reservations.map((r) => r.id)) };
  }, [state]);

  const refetch = useCallback(
    async (d: string) => {
      const { data, error } = await supabase.rpc("host_day", { p_date: d });
      if (d !== dateRef.current) return;
      if (error || !data) {
        setState((s) => ({ ...s, date: d, error: friendlyErrorMessage(error, STAFF_ERROR_MESSAGES) }));
        return;
      }
      const known = knownRef.current;
      if (known && known.date === d) {
        const fresh = data.reservations.filter((r) => !known.ids.has(r.id) && r.source === "site" && r.status !== "cancelled");
        const last = fresh[fresh.length - 1];
        if (last) {
          // "Ver" filtra a linha do tempo pelo código: o cartão aparece mesmo num grupo recolhido
          setToast({
            id: Date.now(),
            message: `Nova reserva pelo site: ${firstName(last.customer.full_name)} · ${last.start_time} · ${peopleLabel(last.party_size)}`,
            tone: "success",
            actionLabel: "Ver",
            onAction: () => {
              setQuery(last.code);
              setTab("linha");
              setLeftTab("linha");
            },
          });
        }
      }
      setState({ date: d, day: data, error: null });
      setNow(Date.now());
    },
    [supabase]
  );

  // troca de dia
  useEffect(() => {
    if (state.date === date) return;
    let cancelled = false;
    supabase.rpc("host_day", { p_date: date }).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) setState((s) => ({ ...s, date, error: friendlyErrorMessage(error, STAFF_ERROR_MESSAGES) }));
      else {
        setState({ date, day: data, error: null });
        setNow(Date.now());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date, state.date, supabase]);

  // Tempo real: qualquer mudança em reservas, mesas ou fila recarrega o dia (em lote).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refetch(dateRef.current), 400);
    };
    const channel = supabase
      .channel("salao")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservation_tables" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "waitlist" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "dining_tables" }, schedule)
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [supabase, refetch]);

  // Relógio (atrasos, minutos na mesa) e lembretes simulados devidos.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    const runReminders = () => void supabase.rpc("run_due_reminders");
    runReminders();
    const reminders = setInterval(runReminders, 5 * 60000);
    return () => {
      clearInterval(tick);
      clearInterval(reminders);
    };
  }, [supabase]);

  const grace = day.settings.grace_minutes;
  const statuses = useMemo(() => tableStatuses(day, now, isToday), [day, now, isToday]);
  const summary = useMemo(() => summarizeDay(day, statuses, now), [day, statuses, now]);
  const shift = currentShift(day, nowTimeHHMM(), isToday);

  const groups = useMemo(() => {
    const visible = day.reservations.filter((r) => matchesQuery(r, query));
    const withStatus = visible.map((r) => ({ r, status: displayStatusOf(r, now, grace) }));
    const pick = (fn: (s: DisplayStatus) => boolean) => withStatus.filter((x) => fn(x.status));
    const upcoming = pick((s) => s === "confirmed" || s === "pending");
    // hoje: separa quem chega na próxima hora do resto do dia
    const soonLimit = now + 60 * 60000;
    const isSoon = (r: HostReservation) => isToday && dateTimeToUtcMillis(r.date, r.start_time) <= soonLimit;
    return {
      late: pick((s) => s === "late"),
      soon: upcoming.filter((x) => isSoon(x.r)),
      later: upcoming.filter((x) => !isSoon(x.r)),
      seated: pick((s) => s === "seated"),
      ended: pick((s) => s === "completed" || s === "no_show" || s === "cancelled"),
    };
  }, [day, now, grace, query, isToday]);

  const showToast = (message: string, extra?: Partial<ToastData>) =>
    setToast({ id: Date.now(), message, tone: "success", ...extra });
  const showError = (error: unknown) => setToast({ id: Date.now(), message: friendlyErrorMessage(error, STAFF_ERROR_MESSAGES), tone: "error" });
  const closeToast = useCallback(() => setToast(null), []);

  async function run(id: string, fn: () => PromiseLike<{ error: unknown }>, ok?: string, undo?: () => void) {
    setBusyId(id);
    const { error } = await fn();
    setBusyId(null);
    if (error) {
      showError(error);
      return false;
    }
    if (ok) showToast(ok, undo ? { onAction: undo, actionLabel: "Desfazer" } : undefined);
    await refetch(dateRef.current);
    return true;
  }

  const setStatus = (r: HostReservation, status: "no_show" | "cancelled" | "completed" | "confirmed" | "seated", reason?: string) => {
    const name = firstName(r.customer.full_name);
    const tables = tableLabels(day, r.table_ids);
    const messages: Record<typeof status, string> = {
      no_show: `Falta registrada: ${name}.`,
      cancelled: `Reserva de ${name} cancelada.`,
      completed: `Mesa ${tables} liberada.`,
      confirmed: `Reserva de ${name} voltou para confirmada.`,
      seated: `${name} voltou para a mesa ${tables}.`,
    };
    const undoTo: Partial<Record<typeof status, "confirmed" | "seated">> = {
      no_show: "confirmed",
      completed: "seated",
      cancelled: "confirmed",
    };
    const back = undoTo[status];
    return run(
      r.id,
      () => supabase.rpc("set_reservation_status", { p_id: r.id, p_status: status, p_reason: reason ?? null }),
      messages[status],
      back ? () => void run(r.id, () => supabase.rpc("set_reservation_status", { p_id: r.id, p_status: back }), "Desfeito.") : undefined
    );
  };

  const actions: CardActions = {
    onSeat: (r) => {
      // pré-seleciona as mesas da reserva se estiverem livres agora
      const free = r.table_ids.filter((id) => {
        const st = statuses.get(id);
        return st && st.state !== "occupied" && st.state !== "check" && st.state !== "blocked";
      });
      setSeatIds(free);
      setSeat({ reservation: r, mode: "seat" });
    },
    onStatus: (r, status) => {
      if (status === "cancelled") {
        setCancelReason(CANCEL_REASONS[0]);
        setCancelFor(r);
        return;
      }
      void setStatus(r, status);
    },
    onToggleCheck: (r) =>
      void run(
        r.id,
        () => supabase.rpc("set_check_requested", { p_id: r.id, p_on: !r.check_requested_at }),
        r.check_requested_at ? "Pedido de conta desmarcado." : `Mesa ${tableLabels(day, r.table_ids)} pediu a conta.`
      ),
    onMoveTable: (r) => {
      setSeatIds(r.table_ids);
      setSeat({ reservation: r, mode: "move" });
    },
    onMessage: (r) => setMessageFor(r),
    onOpen: (r) => setDetailsFor(r),
  };

  async function confirmSeat() {
    if (!seat) return;
    if (seat.mode === "waitlist") {
      const w = seat.waitlist;
      const ok = await run(
        w.id,
        () => supabase.rpc("waitlist_seat", { p_id: w.id, p_table_ids: seatIds }),
        `${firstName(w.customer.full_name)} sentou na mesa ${tableLabels(day, seatIds)}.`
      );
      if (ok) setSeat(null);
      return;
    }
    const r = seat.reservation;
    const changed = seatIds.length > 0 && (seatIds.length !== r.table_ids.length || seatIds.some((id) => !r.table_ids.includes(id)));
    setBusyId(r.id);
    if (changed) {
      const { error } = await supabase.rpc("assign_tables", { p_reservation_id: r.id, p_table_ids: seatIds });
      if (error) {
        setBusyId(null);
        showError(error);
        return;
      }
    }
    setBusyId(null);
    if (seat.mode === "move") {
      showToast(`Reserva de ${firstName(r.customer.full_name)} agora na mesa ${tableLabels(day, seatIds)}.`);
      await refetch(dateRef.current);
      setSeat(null);
      return;
    }
    const ok = await run(
      r.id,
      () => supabase.rpc("set_reservation_status", { p_id: r.id, p_status: "seated" }),
      `${firstName(r.customer.full_name)} sentou na mesa ${tableLabels(day, seatIds.length ? seatIds : r.table_ids)}.`,
      () => void run(r.id, () => supabase.rpc("set_reservation_status", { p_id: r.id, p_status: "confirmed" }), "Desfeito.")
    );
    if (ok) setSeat(null);
  }

  async function dropOnTable(reservationId: string, table: HostTable) {
    const r = day.reservations.find((x) => x.id === reservationId);
    if (!r || r.table_ids.includes(table.id)) return;
    const previous = r.table_ids;
    await run(
      r.id,
      () => supabase.rpc("assign_tables", { p_reservation_id: r.id, p_table_ids: [table.id] }),
      `Reserva de ${firstName(r.customer.full_name)} movida para a mesa ${table.label}.`,
      previous.length
        ? () => void run(r.id, () => supabase.rpc("assign_tables", { p_reservation_id: r.id, p_table_ids: previous }), "Desfeito.")
        : undefined
    );
  }

  const seatParty = seat ? (seat.mode === "waitlist" ? seat.waitlist.party_size : seat.reservation.party_size) : 0;
  const seatTitle = seat
    ? seat.mode === "waitlist"
      ? `Sentar ${firstName(seat.waitlist.customer.full_name)}`
      : seat.mode === "move"
        ? `Trocar mesa de ${firstName(seat.reservation.customer.full_name)}`
        : `${firstName(seat.reservation.customer.full_name)} chegou`
    : "";

  // ---------------------------------------------------------------------------

  const timeline = (
    <div className="flex flex-col gap-5">
      <SearchInput
        placeholder="Buscar por nome, telefone ou código"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar reserva"
      />
      {day.reservations.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={22} />}
          title="Nenhuma reserva neste dia"
          message="As reservas feitas pelo site, telefone ou WhatsApp aparecem aqui na hora."
          action={
            <Button onClick={() => setNewOpen(true)}>
              <PlusIcon size={16} /> Nova reserva
            </Button>
          }
        />
      ) : (
        <>
          <TimelineGroup title="Atrasados" tone="late" items={groups.late} {...{ day, now, busyId, actions }} />
          <TimelineGroup title="Chegando na próxima hora" items={groups.soon} {...{ day, now, busyId, actions }} />
          <TimelineGroup title="Na mesa agora" items={groups.seated} {...{ day, now, busyId, actions }} />
          <TimelineGroup
            title={isToday ? "Mais tarde" : "Reservas do dia"}
            items={groups.later}
            collapseAfter={isToday && !query ? 6 : undefined}
            {...{ day, now, busyId, actions }}
          />
          {groups.ended.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowEnded((v) => !v)}
                aria-expanded={showEnded}
                className="mb-3 flex min-h-tap w-full items-center justify-between rounded-control px-1 text-xs font-semibold uppercase tracking-wide text-stone-500 hover:text-stone-800"
              >
                Encerradas ({groups.ended.length})
                <ChevronIcon direction={showEnded ? "up" : "down"} size={16} />
              </button>
              {showEnded && (
                <div className="flex flex-col gap-3">
                  {groups.ended.map(({ r, status }) => (
                    <ReservationCard key={r.id} r={r} status={status} tablesLabel={tableLabels(day, r.table_ids)} now={now} busy={busyId === r.id} actions={actions} />
                  ))}
                </div>
              )}
            </section>
          )}
          {query && groups.late.length + groups.soon.length + groups.later.length + groups.seated.length + groups.ended.length === 0 && (
            <EmptyState compact message="Nenhuma reserva encontrada com essa busca." />
          )}
        </>
      )}
    </div>
  );

  const waitlist = (
    <WaitlistPanel
      entries={day.waitlist}
      now={now}
      busyId={busyId}
      onAdd={() => setWalkIn({ open: true, tableId: null })}
      onNotify={(w) =>
        void run(w.id, () => supabase.rpc("waitlist_notify", { p_id: w.id }), `Aviso enviado para ${firstName(w.customer.full_name)} (WhatsApp simulado).`)
      }
      onSeat={(w) => {
        setSeatIds([]);
        setSeat({ waitlist: w, mode: "waitlist" });
      }}
      onRemove={(w) =>
        void run(
          w.id,
          () => supabase.rpc("waitlist_set_status", { p_id: w.id, p_status: "cancelled" }),
          `${firstName(w.customer.full_name)} saiu da fila.`,
          () => void run(w.id, () => supabase.rpc("waitlist_set_status", { p_id: w.id, p_status: "waiting" }), "Desfeito.")
        )
      }
    />
  );

  const map = (
    <TableMap
      day={day}
      statuses={statuses}
      isToday={isToday}
      now={now}
      area={area}
      onAreaChange={setArea}
      onTableClick={setTableFor}
      onDropReservation={dropOnTable}
    />
  );

  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
      {/* Cabeçalho do dia */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-stone-500">
            {shift
              ? `${isToday && shift.open_time > nowTimeHHMM() ? "Próximo: " : ""}${shift.name} · ${shift.open_time}–${shift.close_time}`
              : isToday && day.shifts.length > 0
                ? "Turnos de hoje encerrados"
                : "Sem turno neste dia"}
            {isToday && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${live ? "text-status-confirmed" : "text-stone-400"}`}>
                <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-status-confirmed" : "bg-stone-300"}`} aria-hidden="true" />
                {live ? "Ao vivo" : "Conectando"}
              </span>
            )}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <button type="button" onClick={() => setDate((d) => isoDateAddDays(d, -1))} aria-label="Dia anterior" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100">
              <ChevronIcon direction="left" size={20} />
            </button>
            <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">
              <span className="sm:hidden">{(date === today ? "Hoje · " : "") + formatWeekdayDateShort(date)}</span>
              <span className="hidden sm:inline">{formatDateHeading(date)}</span>
            </h1>
            <button type="button" onClick={() => setDate((d) => isoDateAddDays(d, 1))} aria-label="Próximo dia" className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100">
              <ChevronIcon direction="right" size={20} />
            </button>
            {date !== today && (
              <button type="button" onClick={() => setDate(today)} className="min-h-tap rounded-full px-3 text-sm font-medium text-brand-ink hover:bg-brand-soft">
                Voltar para hoje
              </button>
            )}
          </div>
        </div>
        <div className="hidden gap-2 lg:flex">
          <Button variant="secondary" onClick={() => setNewOpen(true)}>
            <PlusIcon size={16} /> Nova reserva
          </Button>
          {isToday && (
            <Button onClick={() => setWalkIn({ open: true, tableId: null })}>
              <WalkInIcon size={18} /> Chegou sem reserva
            </Button>
          )}
        </div>
      </div>

      <dl
        tabIndex={0}
        aria-label="Resumo do dia (role para o lado para ver tudo)"
        className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
        <Stat label="Reservas" value={summary.reservations} />
        <Stat label="Pessoas" value={summary.people} hint={isToday ? `${summary.seatedPeople} na casa` : undefined} />
        <Stat label="Na mesa" value={summary.seated} hint={isToday ? `${summary.tablesBusy} mesas` : undefined} />
        <Stat label="Mesas livres" value={isToday ? summary.tablesFree : "—"} />
        <Stat label="Atrasados" value={summary.late} tone={summary.late > 0 ? "late" : undefined} />
        <Stat label="Na fila" value={summary.waiting} />
      </dl>

      {state.error && (
        <div className="mb-5">
          <ErrorState message={state.error} onRetry={() => void refetch(date)} />
        </div>
      )}

      {/* Celular/tablet: abas */}
      <div className="mb-4 lg:hidden">
        <SegmentedControl
          stretch
          label="Visão do salão"
          value={tab}
          onChange={setTab}
          options={[
            { key: "linha", label: "Reservas" },
            { key: "mapa", label: "Mapa" },
            { key: "fila", label: "Fila", badge: day.waitlist.length },
          ]}
        />
      </div>
      <div className="pb-20 lg:hidden">
        {tab === "linha" && timeline}
        {tab === "mapa" && <Card padding="sm">{map}</Card>}
        {tab === "fila" && waitlist}
      </div>

      {/* Desktop: linha do tempo + mapa lado a lado */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <SegmentedControl
            stretch
            label="Lista"
            value={leftTab}
            onChange={setLeftTab}
            options={[
              { key: "linha", label: "Linha do tempo" },
              { key: "fila", label: "Fila de espera", badge: day.waitlist.length },
            ]}
          />
          {leftTab === "linha" ? timeline : waitlist}
        </div>
        <Card className="sticky top-6">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h2 className="whitespace-nowrap text-base font-semibold text-stone-900">Mapa do salão</h2>
            <p className="text-xs text-stone-500">Arraste uma reserva até uma mesa para trocar</p>
          </div>
          {map}
        </Card>
      </div>

      {/* Botões fixos no celular */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          aria-label="Nova reserva"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-800 shadow-elevated active:scale-95"
        >
          <PlusIcon size={22} />
        </button>
        {isToday && (
          <button
            type="button"
            onClick={() => setWalkIn({ open: true, tableId: null })}
            className="flex h-14 items-center gap-2 rounded-full bg-brand px-5 font-semibold text-brand-contrast shadow-elevated active:scale-95"
          >
            <WalkInIcon size={20} /> Chegou sem reserva
          </button>
        )}
      </div>

      {/* Diálogos */}
      <Modal
        open={seat !== null}
        onClose={() => setSeat(null)}
        title={seatTitle}
        description={seat ? `${peopleLabel(seatParty)} · escolha a mesa` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSeat(null)}>
              Voltar
            </Button>
            <Button disabled={seatIds.length === 0 || busyId !== null} onClick={confirmSeat}>
              {seat?.mode === "move" ? "Trocar mesa" : `Sentar${seatIds.length ? ` na mesa ${tableLabels(day, seatIds)}` : ""}`}
            </Button>
          </>
        }
      >
        {seat && (
          <TablePicker
            day={day}
            statuses={statuses}
            party={seatParty}
            selected={seatIds}
            onChange={setSeatIds}
            ownTableIds={seat.mode === "waitlist" ? [] : seat.reservation.table_ids}
          />
        )}
      </Modal>

      <Modal
        open={cancelFor !== null}
        onClose={() => setCancelFor(null)}
        title="Cancelar reserva?"
        description={cancelFor ? `${cancelFor.customer.full_name} · ${cancelFor.start_time} · ${peopleLabel(cancelFor.party_size)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelFor(null)}>
              Manter
            </Button>
            <Button
              variant="danger"
              disabled={busyId !== null}
              onClick={async () => {
                if (!cancelFor) return;
                const ok = await setStatus(cancelFor, "cancelled", cancelReason);
                if (ok) setCancelFor(null);
              }}
            >
              Cancelar reserva
            </Button>
          </>
        }
      >
        <Select id="cancel-reason" label="Motivo" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
          {CANCEL_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
        <p className="mt-3 text-sm text-stone-500">O cliente recebe a mensagem de cancelamento e a mesa é liberada para a fila.</p>
      </Modal>

      <WalkInDialog
        key={walkIn.tableId ?? "walkin"}
        open={walkIn.open}
        presetTableId={walkIn.tableId}
        onClose={() => setWalkIn({ open: false, tableId: null })}
        day={day}
        statuses={statuses}
        onDone={(message) => {
          showToast(message);
          void refetch(dateRef.current);
        }}
      />

      <NewReservationDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        defaultDate={date}
        onDone={(message) => {
          showToast(message);
          void refetch(dateRef.current);
        }}
      />

      <MessageDialog
        key={messageFor?.id ?? "msg"}
        reservation={messageFor}
        restaurant={day.settings.name}
        onClose={() => setMessageFor(null)}
        onSent={showToast}
      />

      <ReservationDetailsDialog
        reservation={detailsFor ? (day.reservations.find((r) => r.id === detailsFor.id) ?? detailsFor) : null}
        tablesLabel={detailsFor ? tableLabels(day, detailsFor.table_ids) : ""}
        restaurant={day.settings.name}
        onClose={() => setDetailsFor(null)}
        onSaved={(message) => {
          showToast(message);
          void refetch(dateRef.current);
        }}
      />

      <TableDialog
        table={tableFor}
        day={day}
        status={tableFor ? statuses.get(tableFor.id) : undefined}
        now={now}
        isToday={isToday}
        busy={busyId !== null}
        onClose={() => setTableFor(null)}
        onOpenReservation={(r) => {
          setTableFor(null);
          setDetailsFor(r);
        }}
        onWalkIn={(t) => {
          setTableFor(null);
          setWalkIn({ open: true, tableId: t.id });
        }}
        onClean={(t) =>
          void run(t.id, () => supabase.rpc("set_table_state", { p_table_id: t.id, p_clean: true }), `Mesa ${t.label} pronta.`).then(() => setTableFor(null))
        }
        onBlock={(t, blocked, reason) =>
          void run(
            t.id,
            () => supabase.rpc("set_table_state", { p_table_id: t.id, p_blocked: blocked, p_reason: reason ?? null }),
            blocked ? `Mesa ${t.label} bloqueada.` : `Mesa ${t.label} desbloqueada.`
          ).then(() => setTableFor(null))
        }
        onComplete={(r) => {
          setTableFor(null);
          void setStatus(r, "completed");
        }}
      />

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: "late" }) {
  return (
    <div className={`min-w-[104px] shrink-0 rounded-control border bg-white px-3 py-2 sm:min-w-0 sm:py-2.5 ${tone === "late" ? "border-status-late/40" : "border-stone-200/80"}`}>
      <dt className="truncate text-xs text-stone-500">{label}</dt>
      <dd className={`text-xl font-semibold ${tone === "late" ? "text-status-late" : "text-stone-900"}`}>{value}</dd>
      {hint && <dd className="truncate text-[11px] text-stone-500">{hint}</dd>}
    </div>
  );
}

function TimelineGroup({
  title,
  tone,
  items,
  day,
  now,
  busyId,
  actions,
  collapseAfter,
}: {
  title: string;
  tone?: "late";
  items: { r: HostReservation; status: DisplayStatus }[];
  day: HostDay;
  now: number;
  busyId: string | null;
  actions: CardActions;
  /** Mostra só os primeiros N (com "ver todas"). */
  collapseAfter?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const limited = collapseAfter !== undefined && !expanded && items.length > collapseAfter;
  const shown = limited ? items.slice(0, collapseAfter) : items;
  return (
    <section aria-label={title}>
      <h2 className={`mb-3 px-1 text-xs font-semibold uppercase tracking-wide ${tone === "late" ? "text-status-late" : "text-stone-500"}`}>
        {title} ({items.length})
      </h2>
      <div className="flex flex-col gap-3">
        {shown.map(({ r, status }) => (
          <ReservationCard
            key={r.id}
            r={r}
            status={status}
            tablesLabel={tableLabels(day, r.table_ids)}
            now={now}
            busy={busyId === r.id}
            actions={actions}
            draggable
          />
        ))}
      </div>
      {limited && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 min-h-tap w-full rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Ver todas as {items.length} reservas
        </button>
      )}
    </section>
  );
}
