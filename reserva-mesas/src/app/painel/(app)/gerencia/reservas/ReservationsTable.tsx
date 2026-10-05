"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterPills } from "@/components/ui/FilterPills";
import { GroupLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast, type ToastData } from "@/components/ui/Toast";
import { ActionsMenu, type ActionItem } from "@/components/ui/ActionsMenu";
import { ReservationHistoryView } from "@/components/reservas/ReservationHistory";
import { EditReservationForm } from "@/components/salao/ReservationDetailsDialog";
import { CalendarIcon, DownloadIcon, FilterIcon } from "@/components/icons";
import { formatWeekdayDateShort, isoDateAddDays } from "@/lib/dates";
import { formatPhone, peopleLabel, pluralize, telHref } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import {
  friendlyErrorMessage,
  OCCASION_LABEL,
  SOURCE_LABEL,
  STAFF_ERROR_MESSAGES,
  STATUS_LABEL,
} from "@/lib/constants";
import type { AreaRow, ManagerReservation, ReservationSource, ReservationStatus } from "@/lib/types";

type Preset = "hoje" | "proximos7" | "ultimos7" | "ultimos30" | "personalizado";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "proximos7", label: "Próximos 7 dias" },
  { key: "ultimos7", label: "Últimos 7 dias" },
  { key: "ultimos30", label: "Últimos 30 dias" },
  { key: "personalizado", label: "Personalizado" },
];

function rangeFor(preset: Preset, today: string, custom: [string, string]): [string, string] {
  if (preset === "hoje") return [today, today];
  if (preset === "proximos7") return [today, isoDateAddDays(today, 6)];
  if (preset === "ultimos7") return [isoDateAddDays(today, -6), today];
  if (preset === "ultimos30") return [isoDateAddDays(today, -29), today];
  return custom;
}

const STATUSES: ReservationStatus[] = ["confirmed", "pending", "seated", "completed", "cancelled", "no_show"];
const SOURCES: ReservationSource[] = ["site", "telefone", "whatsapp", "instagram", "walk_in", "manual"];
const PAGE = 120;

/** Conta só o que ocupa mesa: canceladas e faltas ficam de fora do total de pessoas. */
function countsOf(rows: ManagerReservation[]) {
  const live = rows.filter((r) => r.status !== "cancelled");
  return {
    count: live.length,
    people: live.filter((r) => r.status !== "no_show").reduce((s, r) => s + r.party_size, 0),
  };
}

export function ReservationsTable({
  today,
  areas,
  restaurant,
  initialRange,
}: {
  today: string;
  areas: AreaRow[];
  restaurant: string;
  initialRange?: [string, string];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [preset, setPreset] = useState<Preset>(initialRange ? "personalizado" : "proximos7");
  const [custom, setCustom] = useState<[string, string]>(initialRange ?? [today, isoDateAddDays(today, 13)]);
  const [status, setStatus] = useState<ReservationStatus | "">("");
  const [source, setSource] = useState<ReservationSource | "">("");
  const [area, setArea] = useState("");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ key: string; rows: ManagerReservation[]; error: string | null } | null>(null);
  const [historyFor, setHistoryFor] = useState<ManagerReservation | null>(null);
  const [editFor, setEditFor] = useState<ManagerReservation | null>(null);
  const [cancelFor, setCancelFor] = useState<ManagerReservation | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const [from, to] = rangeFor(preset, today, custom);
  const invalidRange = !from || !to || to < from;
  const key = `${from}|${to}|${refresh}`;
  const loading = !invalidRange && result?.key !== key;
  // Períodos passados: mais recentes primeiro. Próximos: em ordem de chegada.
  const descending = preset === "ultimos7" || preset === "ultimos30";

  useEffect(() => {
    if (invalidRange) return;
    let cancelled = false;
    supabase.rpc("manager_reservations", { p_from: from, p_to: to }).then(({ data, error }) => {
      if (cancelled) return;
      setResult({ key: `${from}|${to}|${refresh}`, rows: data ?? [], error: error ? friendlyErrorMessage(error) : null });
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, from, to, refresh, invalidRange]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const filtered = (result?.rows ?? []).filter(
      (r) =>
        (!status || r.status === status) &&
        (!source || r.source === source) &&
        (!area || r.area_id === area) &&
        (!q ||
          r.customer_name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          (digits.length >= 3 && (r.customer_phone ?? "").includes(digits)))
    );
    return descending ? [...filtered].reverse() : filtered;
  }, [result, status, source, area, query, descending]);

  const totals = useMemo(() => countsOf(rows), [rows]);

  // Agrupa por dia (as linhas já vêm ordenadas por data e horário)
  const groups = useMemo(() => {
    const out: { date: string; rows: ManagerReservation[] }[] = [];
    for (const r of rows.slice(0, limit)) {
      const last = out[out.length - 1];
      if (last && last.date === r.date) last.rows.push(r);
      else out.push({ date: r.date, rows: [r] });
    }
    return out;
  }, [rows, limit]);
  const dayTotals = useMemo(() => {
    const byDay = new Map<string, ManagerReservation[]>();
    for (const r of rows) {
      const list = byDay.get(r.date);
      if (list) list.push(r);
      else byDay.set(r.date, [r]);
    }
    return new Map([...byDay].map(([d, list]) => [d, countsOf(list)]));
  }, [rows]);

  const activeFilters = [status, source, area].filter(Boolean).length;

  function exportCSV() {
    downloadCSV(
      `reservas-${from}-a-${to}.csv`,
      [
        "Data",
        "Horário",
        "Código",
        "Cliente",
        "Telefone",
        "Pessoas",
        "Mesa",
        "Origem",
        "Status",
        "Ocasião",
        "Alergias",
        "Pedido do cliente",
        "Observação interna",
        "Motivo do cancelamento",
      ],
      // a planilha sai sempre em ordem cronológica, independente da ordem da tela
      (descending ? [...rows].reverse() : rows).map((r) => [
        r.date.split("-").reverse().join("/"),
        r.start_time,
        r.code,
        r.customer_name,
        formatPhone(r.customer_phone),
        r.party_size,
        r.tables ?? "",
        SOURCE_LABEL[r.source],
        STATUS_LABEL[r.status],
        r.occasion ? OCCASION_LABEL[r.occasion] : "",
        r.dietary_notes ?? "",
        r.notes ?? "",
        r.internal_notes ?? "",
        r.cancel_reason ?? "",
      ])
    );
  }

  async function cancelReservation(r: ManagerReservation) {
    setBusy(true);
    const { error } = await supabase.rpc("set_reservation_status", {
      p_id: r.id,
      p_status: "cancelled",
      p_reason: "Cancelada pelo restaurante",
    });
    setBusy(false);
    if (error) {
      setToast({ id: Date.now(), message: friendlyErrorMessage(error, STAFF_ERROR_MESSAGES), tone: "error" });
      return;
    }
    setCancelFor(null);
    setToast({ id: Date.now(), message: `Reserva de ${r.customer_name.split(" ")[0]} cancelada.`, tone: "success" });
    setRefresh((n) => n + 1);
  }

  function actionsFor(r: ManagerReservation): ActionItem[] {
    const editable = r.status === "pending" || r.status === "confirmed" || r.status === "seated";
    const items: ActionItem[] = [{ label: "Ver histórico", onSelect: () => setHistoryFor(r) }];
    if (editable) items.push({ label: "Editar", onSelect: () => setEditFor(r) });
    if (r.customer_phone) items.push({ label: "Ligar", href: telHref(r.customer_phone) });
    if (r.status === "pending" || r.status === "confirmed") {
      items.push({ label: "Cancelar reserva", tone: "danger", onSelect: () => setCancelFor(r) });
    }
    return items;
  }

  function dayHeading(date: string) {
    const t = dayTotals.get(date);
    const day = formatWeekdayDateShort(date);
    return t ? `${day} · ${pluralize(t.count, "reserva", "reservas")} · ${peopleLabel(t.people)}` : day;
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Reservas"
        subtitle={
          invalidRange
            ? "Escolha um período válido"
            : loading
              ? "Carregando..."
              : `${pluralize(totals.count, "reserva", "reservas")} · ${peopleLabel(totals.people)} no período`
        }
        action={
          <Button variant="secondary" size="sm" onClick={exportCSV} disabled={loading || rows.length === 0}>
            <DownloadIcon size={16} /> Exportar CSV
          </Button>
        }
      />

      {/* Filtros: numa faixa acima de tudo que eles afetam */}
      <div className="-mt-2 flex flex-col gap-3">
        <FilterPills
          options={PRESETS}
          value={preset}
          onChange={(p) => {
            setPreset(p);
            setLimit(PAGE);
          }}
          label="Período"
          scrollOnMobile
        />
        {preset === "personalizado" && (
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <Input id="from" type="date" label="De" value={custom[0]} onChange={(e) => setCustom([e.target.value, custom[1]])} />
            <Input
              id="to"
              type="date"
              label="Até"
              value={custom[1]}
              min={custom[0]}
              onChange={(e) => setCustom([custom[0], e.target.value])}
            />
          </div>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <SearchInput
            placeholder="Nome, telefone ou código"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            aria-label="Buscar reserva"
          />
          {/* No celular os filtros ficam atrás de um botão; do tablet pra cima, sempre à vista */}
          <button
            type="button"
            className={`relative inline-flex w-11 items-center justify-center rounded-control border transition-colors sm:hidden ${
              filtersOpen || activeFilters > 0
                ? "border-brand bg-brand-soft text-brand-ink"
                : "border-stone-200 bg-white text-stone-600"
            }`}
            aria-expanded={filtersOpen}
            aria-controls="reservation-filters"
            aria-label={activeFilters > 0 ? `Filtros (${activeFilters} ativos)` : "Filtros"}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <FilterIcon size={20} />
            {activeFilters > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-brand-contrast">
                {activeFilters}
              </span>
            )}
          </button>
          <div
            id="reservation-filters"
            className={`${filtersOpen ? "grid" : "hidden"} col-span-2 grid-cols-1 gap-3 sm:contents`}
          >
            <Select
              id="f-status"
              aria-label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ReservationStatus | "");
                setLimit(PAGE);
              }}
            >
              <option value="">Todos os status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
            <Select
              id="f-source"
              aria-label="Origem"
              value={source}
              onChange={(e) => {
                setSource(e.target.value as ReservationSource | "");
                setLimit(PAGE);
              }}
            >
              <option value="">Todas as origens</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABEL[s]}
                </option>
              ))}
            </Select>
            <Select
              id="f-area"
              aria-label="Área"
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                setLimit(PAGE);
              }}
            >
              <option value="">Todas as áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {invalidRange ? (
        <EmptyState
          icon={<CalendarIcon size={22} />}
          title="Período inválido"
          message="A data final precisa ser igual ou depois da data inicial."
        />
      ) : result?.error && !loading ? (
        <ErrorState message={result.error} onRetry={() => setRefresh((n) => n + 1)} />
      ) : loading && !result ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Carregando reservas">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
      ) : !loading && rows.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={22} />}
          title="Nenhuma reserva"
          message="Nenhuma reserva com esses filtros. Mude o período ou limpe a busca."
        />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
          {/* Tablet e desktop: tabela agrupada por dia */}
          <Card padding="none" className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th scope="col" className="w-20 px-4 py-3 font-medium">
                    Horário
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Cliente
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Pessoas
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Mesa
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">
                    Origem
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="w-16 px-4 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g.date}>
                    <tr className="border-b border-stone-100 bg-stone-50/70">
                      <th scope="colgroup" colSpan={7} className="px-4 py-2 text-left text-xs font-semibold text-stone-600">
                        {dayHeading(g.date)}
                      </th>
                    </tr>
                    {g.rows.map((r) => (
                      <tr key={r.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60">
                        <td className="px-4 py-3 font-semibold tabular-nums text-stone-900">{r.start_time}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-stone-900">{r.customer_name}</p>
                          <p className="text-xs text-stone-500">
                            {formatPhone(r.customer_phone)} · {r.code}
                          </p>
                          {r.dietary_notes && (
                            <p className="mt-0.5 text-xs font-medium text-red-700">Alergia: {r.dietary_notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{r.party_size}</td>
                        <td className="px-4 py-3">{r.tables ?? "—"}</td>
                        <td className="hidden px-4 py-3 lg:table-cell">{SOURCE_LABEL[r.source]}</td>
                        <td className="px-4 py-3">
                          <Badge tone={r.status}>{STATUS_LABEL[r.status]}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <ActionsMenu items={actionsFor(r)} label={`Ações da reserva de ${r.customer_name}`} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Celular: cartões agrupados por dia */}
          <div className="flex flex-col gap-5 md:hidden">
            {groups.map((g) => (
              <section key={g.date}>
                <GroupLabel>{dayHeading(g.date)}</GroupLabel>
                <ul className="flex flex-col gap-2">
                  {g.rows.map((r) => (
                    <li key={r.id}>
                      <Card padding="sm">
                        <div className="flex items-center gap-3">
                          <p className="w-12 shrink-0 text-base font-semibold tabular-nums text-stone-900">{r.start_time}</p>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-stone-900">{r.customer_name}</p>
                            <p className="truncate text-xs text-stone-500">
                              {peopleLabel(r.party_size)} · Mesa {r.tables ?? "—"} · {SOURCE_LABEL[r.source]}
                            </p>
                            <div className="mt-1">
                              <Badge tone={r.status}>{STATUS_LABEL[r.status]}</Badge>
                            </div>
                          </div>
                          <ActionsMenu items={actionsFor(r)} label={`Ações da reserva de ${r.customer_name}`} />
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {rows.length > limit && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
                Mostrar mais ({rows.length - limit} restantes)
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal
        open={historyFor !== null}
        onClose={() => setHistoryFor(null)}
        title={historyFor?.customer_name ?? ""}
        description={
          historyFor ? `${formatWeekdayDateShort(historyFor.date)} · ${historyFor.start_time} · ${historyFor.code}` : undefined
        }
        size="lg"
      >
        {historyFor && <ReservationHistoryView reservationId={historyFor.id} restaurant={restaurant} />}
      </Modal>

      <Modal open={editFor !== null} onClose={() => setEditFor(null)} title="Editar reserva" description={editFor?.customer_name}>
        {editFor && (
          <EditReservationForm
            reservation={editFor}
            onCancel={() => setEditFor(null)}
            onSaved={(message) => {
              setEditFor(null);
              setToast({ id: Date.now(), message, tone: "success" });
              setRefresh((n) => n + 1);
            }}
          />
        )}
      </Modal>

      <Modal
        open={cancelFor !== null}
        onClose={() => setCancelFor(null)}
        title="Cancelar reserva?"
        description={
          cancelFor ? `${cancelFor.customer_name} · ${formatWeekdayDateShort(cancelFor.date)} às ${cancelFor.start_time}` : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelFor(null)}>
              Manter
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => cancelFor && cancelReservation(cancelFor)}>
              Cancelar reserva
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600">O cliente recebe a mensagem de cancelamento (simulada) e a mesa é liberada.</p>
      </Modal>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
