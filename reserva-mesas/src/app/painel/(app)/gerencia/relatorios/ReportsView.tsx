"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart } from "@/components/charts/BarChart";
import { ChartCard } from "@/components/charts/ChartCard";
import { CompareTile } from "@/components/charts/CompareTile";
import { MeterList } from "@/components/charts/MeterList";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { FilterPills } from "@/components/ui/FilterPills";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { DownloadIcon } from "@/components/icons";
import { downloadCSV } from "@/lib/csv";
import { dayMonthLabel, formatDateFull, formatWeekdayDateShort, isoDateAddDays, weekdayShortLabel } from "@/lib/dates";
import { formatDuration, formatPercent, peopleLabel } from "@/lib/format";
import { OCCASION_LABEL, SOURCE_LABEL, STATUS_LABEL, WEEKDAY_LABELS, friendlyErrorMessage } from "@/lib/constants";
import {
  PERIOD_LABEL,
  daysIn,
  groupDaily,
  groupingFor,
  monthLabel,
  periodRange,
  previousRange,
  type GroupedRow,
  type Period,
} from "@/lib/relatorios";
import type { ManagerReservation, ReportDailyRow, ReportHourRow, ReportSummary, ReportWeekdayRow } from "@/lib/types";

type Data = {
  summary: ReportSummary;
  previous: ReportSummary;
  daily: ReportDailyRow[];
  hours: ReportHourRow[];
  weekdays: ReportWeekdayRow[];
  dayList: ManagerReservation[];
};

const PERIODS: Period[] = ["7d", "30d", "mes", "3m", "ano", "dia"];
// Segunda primeiro, como o dono pensa a semana
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const pct = (n: number | null) => (n === null ? "—" : formatPercent(n));

function groupLabel(g: GroupedRow, grouping: ReturnType<typeof groupingFor>): string {
  if (grouping === "day") return dayMonthLabel(g.start);
  if (grouping === "week") return dayMonthLabel(g.start);
  return monthLabel(g.key);
}

function groupDetail(g: GroupedRow, grouping: ReturnType<typeof groupingFor>): string {
  if (grouping === "day") return formatWeekdayDateShort(g.start);
  if (grouping === "week") return `Semana de ${dayMonthLabel(g.start)} a ${dayMonthLabel(g.end)}`;
  return monthLabel(g.key);
}

export function ReportsView({ today }: { today: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [period, setPeriod] = useState<Period>("30d");
  const [day, setDay] = useState(isoDateAddDays(today, -1));
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ key: string; data: Data | null; error: string | null } | null>(null);

  const range = periodRange(period, today, day);
  const [from, to] = range;
  const [prevFrom, prevTo] = previousRange(period, range);
  const key = `${from}|${to}|${refresh}`;
  const loading = result?.key !== key;
  const versus = period === "dia" ? `vs ${weekdayShortLabel(range[0]).toLowerCase()} anterior` : `vs ${daysIn(range)} dias anteriores`;

  useEffect(() => {
    if (!from) return;
    let cancelled = false;
    const args = { p_from: from, p_to: to };
    Promise.all([
      supabase.rpc("report_summary", args),
      supabase.rpc("report_summary", { p_from: prevFrom, p_to: prevTo }),
      supabase.rpc("report_daily", args),
      supabase.rpc("report_by_hour", args),
      supabase.rpc("report_by_weekday", args),
      from === to ? supabase.rpc("manager_reservations", args) : Promise.resolve({ data: [], error: null }),
    ]).then(([s, p, d, h, w, l]) => {
      if (cancelled) return;
      const error = s.error ?? p.error ?? d.error ?? h.error ?? w.error ?? l.error;
      setResult({
        key: `${from}|${to}|${refresh}`,
        error: error ? friendlyErrorMessage(error) : null,
        data:
          error || !s.data || !p.data
            ? null
            : {
                summary: s.data,
                previous: p.data,
                daily: d.data ?? [],
                hours: h.data ?? [],
                weekdays: w.data ?? [],
                dayList: (l.data ?? []) as ManagerReservation[],
              },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, from, to, prevFrom, prevTo, refresh]);

  const data = result?.data ?? null;
  const grouping = groupingFor(daysIn(range));
  const groups = data ? groupDaily(data.daily, grouping) : [];

  function exportCSV() {
    if (!data) return;
    if (period === "dia") {
      downloadCSV(
        `relatorio-${range[0]}.csv`,
        ["Horário", "Cliente", "Pessoas", "Mesa", "Origem", "Status"],
        data.dayList.map((r) => [r.start_time, r.customer_name, r.party_size, r.tables ?? "", SOURCE_LABEL[r.source], STATUS_LABEL[r.status]])
      );
      return;
    }
    const first = grouping === "day" ? "Dia" : grouping === "week" ? "Semana (início)" : "Mês";
    downloadCSV(
      `relatorio-${range[0]}-a-${range[1]}.csv`,
      [first, "Reservas", "Pessoas", "Canceladas", "Faltas", "Sem reserva", "Ocupação das mesas (%)"],
      groups.map((g) => [
        grouping === "month" ? monthLabel(g.key) : g.start.split("-").reverse().join("/"),
        g.reservations,
        g.people,
        g.cancelled,
        g.no_shows,
        g.walk_ins,
        g.occupancy === null ? "" : String(g.occupancy).replace(".", ","),
      ])
    );
  }

  const subtitle =
    period === "dia"
      ? formatDateFull(range[0])
      : `${formatWeekdayDateShort(range[0])} a ${formatWeekdayDateShort(range[1])}${range[1] === today ? " (hoje inclui reservas que ainda vão chegar)" : ""}`;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="Relatórios"
        subtitle={subtitle}
        action={
          <Button variant="secondary" size="sm" onClick={exportCSV} disabled={loading || !data}>
            <DownloadIcon size={16} /> Exportar CSV
          </Button>
        }
      />

      {/* Filtros numa faixa só, acima de tudo que eles afetam */}
      <div className="-mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FilterPills
          options={PERIODS.map((p) => ({ key: p, label: PERIOD_LABEL[p] }))}
          value={period}
          onChange={setPeriod}
          label="Período"
          scrollOnMobile
        />
        {period === "dia" && (
          <div className="sm:w-56">
            <Input id="r-day" type="date" label="Dia" value={day} max={isoDateAddDays(today, 60)} onChange={(e) => e.target.value && setDay(e.target.value)} />
          </div>
        )}
      </div>

      {result?.error && !loading ? (
        <ErrorState message={result.error} onRetry={() => setRefresh((n) => n + 1)} />
      ) : !data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="status" aria-label="Carregando relatório">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      ) : (
        <div className={`flex flex-col gap-5 ${loading ? "opacity-60 transition-opacity" : ""}`} aria-busy={loading}>
          <Tiles data={data} versus={versus} />
          {period === "dia" ? (
            <DayDetail data={data} date={range[0]} />
          ) : (
            <PeriodCharts data={data} groups={groups} grouping={grouping} today={today} />
          )}
          <p className="px-1 text-xs text-stone-500">
            Os números vêm só das reservas registradas (o sistema não tem consumo nem faturamento). Ocupação = tempo
            de mesa reservado ÷ tempo de mesa disponível nos turnos abertos.
          </p>
        </div>
      )}
    </div>
  );
}

function Tiles({ data, versus }: { data: Data; versus: string }) {
  const { summary: s, previous: p } = data;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompareTile label="Reservas" current={s.reservations} previous={p.reservations} versus={versus} />
      <CompareTile label="Pessoas" current={s.people} previous={p.people} versus={versus} />
      <CompareTile label="Ocupação das mesas" current={s.occupancy} previous={p.occupancy} percent versus={versus} />
      <CompareTile
        label="Taxa de faltas"
        current={s.no_show_rate}
        previous={p.no_show_rate}
        percent
        goodDown
        versus={versus}
        note={`${s.no_shows} ${s.no_shows === 1 ? "falta" : "faltas"}`}
      />
      <CompareTile
        label="Taxa de cancelamento"
        current={s.cancel_rate}
        previous={p.cancel_rate}
        percent
        goodDown
        versus={versus}
        note={`${s.cancelled} ${s.cancelled === 1 ? "cancelada" : "canceladas"}`}
      />
      <CompareTile
        label="Permanência média"
        current={s.avg_stay_minutes}
        previous={p.avg_stay_minutes}
        format={formatDuration}
        versus={versus}
      />
      <CompareTile
        label="Tamanho médio do grupo"
        current={s.avg_party}
        previous={p.avg_party}
        format={(n) => `${n.toLocaleString("pt-BR")} pessoas`}
        versus={versus}
      />
      <CompareTile label="Chegaram sem reserva" current={s.walk_ins} previous={p.walk_ins} versus={versus} />
    </div>
  );
}

function shareItems<T>(list: T[], label: (x: T) => string, count: (x: T) => number, key: (x: T) => string) {
  const total = list.reduce((sum, x) => sum + count(x), 0);
  return list.map((x) => ({
    key: key(x),
    label: label(x),
    share: total ? (count(x) / total) * 100 : 0,
    value: `${formatPercent(total ? (count(x) / total) * 100 : 0)} · ${count(x)}`,
  }));
}

function SidePanels({ data }: { data: Data }) {
  const s = data.summary;
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card>
        <h2 className="text-base font-semibold text-stone-900">Ocupação por turno</h2>
        <p className="mb-4 mt-0.5 text-sm text-stone-500">Tempo de mesa reservado no turno.</p>
        {s.by_shift.length === 0 ? (
          <p className="text-sm text-stone-500">Sem turnos abertos no período.</p>
        ) : (
          <MeterList
            ariaLabel="Ocupação por turno"
            items={s.by_shift.map((x) => ({ key: x.shift, label: x.shift, share: x.occupancy ?? 0, value: pct(x.occupancy) }))}
          />
        )}
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-stone-900">Origem das reservas</h2>
        <p className="mb-4 mt-0.5 text-sm text-stone-500">De onde vieram (sem contar canceladas).</p>
        {s.by_source.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma reserva no período.</p>
        ) : (
          <MeterList
            ariaLabel="Origem das reservas"
            items={shareItems(s.by_source, (x) => SOURCE_LABEL[x.source], (x) => x.count, (x) => x.source)}
          />
        )}
      </Card>
      <Card>
        <h2 className="text-base font-semibold text-stone-900">Ocasiões</h2>
        <p className="mb-4 mt-0.5 text-sm text-stone-500">Quando o cliente contou o motivo.</p>
        {s.by_occasion.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma ocasião informada no período.</p>
        ) : (
          <MeterList
            ariaLabel="Ocasiões"
            items={shareItems(s.by_occasion, (x) => OCCASION_LABEL[x.occasion], (x) => x.count, (x) => x.occasion)}
          />
        )}
      </Card>
    </div>
  );
}

function HoursChart({ hours, subtitle }: { hours: ReportHourRow[]; subtitle: string }) {
  // Horas sem chegada também aparecem (barra zerada), do primeiro ao último horário com movimento
  const present = hours.filter((h) => h.hour >= 11 && h.hour <= 23);
  const first = Math.min(...present.map((h) => h.hour));
  const last = Math.max(...present.map((h) => h.hour));
  const list =
    present.length === 0
      ? []
      : Array.from({ length: last - first + 1 }, (_, i) => present.find((h) => h.hour === first + i) ?? { hour: first + i, reservations: 0, people: 0 });
  return (
    <ChartCard
      title="Horários de pico"
      subtitle={subtitle}
      table={{ columns: ["Horário", "Reservas", "Pessoas"], rows: list.map((h) => [`${h.hour}h`, h.reservations, h.people]) }}
    >
      <BarChart
        ariaLabel="Pessoas por horário de chegada"
        bars={list.map((h) => ({
          key: String(h.hour),
          label: `${h.hour}h`,
          value: h.people,
          valueLabel: `${peopleLabel(h.people)} · ${h.reservations} reservas`,
          detail: `Chegada às ${h.hour}h`,
        }))}
      />
    </ChartCard>
  );
}

function PeriodCharts({
  data,
  groups,
  grouping,
  today,
}: {
  data: Data;
  groups: GroupedRow[];
  grouping: ReturnType<typeof groupingFor>;
  today: string;
}) {
  const unit = grouping === "day" ? "dia" : grouping === "week" ? "semana" : "mês";
  const tickEvery = groups.length > 20 ? 7 : groups.length > 10 ? 2 : 1;
  const weekdays = WEEK_ORDER.map((w) => data.weekdays.find((x) => x.weekday === w)).filter(
    (x): x is ReportWeekdayRow => x !== undefined
  );

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ChartCard
          title={`Reservas por ${unit}`}
          subtitle={grouping === "day" ? "Passe o mouse (ou o foco) nas barras para ver os números." : `Somadas por ${unit}.`}
          table={{
            columns: [grouping === "day" ? "Dia" : grouping === "week" ? "Semana" : "Mês", "Reservas", "Pessoas", "Canceladas", "Faltas", "Ocupação"],
            rows: groups.map((g) => [groupDetail(g, grouping), g.reservations, g.people, g.cancelled, g.no_shows, pct(g.occupancy)]),
          }}
        >
          <BarChart
            ariaLabel={`Reservas por ${unit}`}
            tickEvery={tickEvery}
            bars={groups.map((g) => ({
              key: g.key,
              label: groupLabel(g, grouping),
              value: g.reservations,
              valueLabel: `${g.reservations} reservas · ${peopleLabel(g.people)} · ocupação ${pct(g.occupancy)}`,
              detail: groupDetail(g, grouping),
              current: grouping === "day" && g.start === today,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Ocupação por dia da semana"
          subtitle="Média do período, só nos dias em que o restaurante abriu."
          table={{
            columns: ["Dia", "Dias abertos", "Reservas", "Pessoas", "Ocupação"],
            rows: weekdays.map((w) => [WEEKDAY_LABELS[w.weekday], w.open_days, w.reservations, w.people, pct(w.occupancy)]),
          }}
        >
          <BarChart
            ariaLabel="Ocupação por dia da semana"
            yFormat={(n) => `${n}%`}
            bars={weekdays.map((w) => ({
              key: String(w.weekday),
              label: WEEKDAY_LABELS[w.weekday].slice(0, 3),
              value: w.occupancy ?? 0,
              valueLabel: w.open_days === 0 ? "Fechado no período" : `Ocupação ${pct(w.occupancy)}`,
              detail: `${WEEKDAY_LABELS[w.weekday]} · ${w.reservations} reservas em ${w.open_days} ${w.open_days === 1 ? "dia" : "dias"}`,
            }))}
          />
        </ChartCard>
      </div>

      <HoursChart hours={data.hours} subtitle="Pessoas por horário de chegada no período." />
      <SidePanels data={data} />
    </>
  );
}

function DayDetail({ data, date }: { data: Data; date: string }) {
  const list = [...data.dayList].sort((a, b) => a.start_time.localeCompare(b.start_time));
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <HoursChart hours={data.hours} subtitle="Pessoas por horário de chegada neste dia." />
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-stone-900">Reservas do dia ({list.length})</h2>
            <Link
              href={`/painel/gerencia/reservas?de=${date}&ate=${date}`}
              className="min-h-9 text-sm font-medium text-brand-ink underline underline-offset-2"
            >
              Abrir em Reservas
            </Link>
          </div>
          {list.length === 0 ? (
            <p className="text-sm text-stone-500">Nenhuma reserva neste dia.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-stone-100 overflow-auto">
              {list.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-12 shrink-0 font-semibold tabular-nums text-stone-900">{r.start_time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-stone-900">{r.customer_name}</span>
                    <span className="block truncate text-xs text-stone-500">
                      {peopleLabel(r.party_size)} · Mesa {r.tables ?? "—"} · {SOURCE_LABEL[r.source]}
                    </span>
                  </span>
                  <Badge tone={r.status}>{STATUS_LABEL[r.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <SidePanels data={data} />
    </>
  );
}
