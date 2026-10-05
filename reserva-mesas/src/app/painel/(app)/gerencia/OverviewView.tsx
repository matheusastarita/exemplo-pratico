"use client";

import Link from "next/link";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BarChart } from "@/components/charts/BarChart";
import { ChartCard } from "@/components/charts/ChartCard";
import { CompareTile, percentChange } from "@/components/charts/CompareTile";
import { MeterList } from "@/components/charts/MeterList";
import { AlertIcon, CalendarIcon, ChartIcon, MapIcon, PeopleIcon } from "@/components/icons";
import { dayMonthLabel, formatDateHeading, formatWeekdayDateShort, weekdayShortLabel } from "@/lib/dates";
import { formatPercent } from "@/lib/format";
import type { ManagerOverview } from "@/lib/types";

const VS = "vs 7 dias anteriores";

function pct(n: number | null) {
  return n === null ? "—" : formatPercent(n);
}

export function OverviewView({ data }: { data: ManagerOverview }) {
  const { day, same_day_last_week: lastWeekDay, week, prev_week: prevWeek } = data;
  const past = data.daily.filter((d) => d.day <= data.today);
  const spark = (pick: (d: (typeof data.daily)[number]) => number) => past.slice(-12).map(pick);

  const bars = data.daily.map((d) => ({
    key: d.day,
    label: d.day === data.today ? "Hoje" : dayMonthLabel(d.day),
    value: d.reservations,
    valueLabel: `${d.reservations} reservas · ${d.people} pessoas`,
    detail: formatWeekdayDateShort(d.day),
    muted: d.day > data.today,
    current: d.day === data.today,
  }));

  const hours = data.hours.filter((h) => h.hour >= 11 && h.hour <= 23);
  const totalHourPeople = hours.reduce((s, h) => s + h.people, 0);
  const peak = hours.reduce<(typeof hours)[number] | null>((best, h) => (!best || h.people > best.people ? h : best), null);

  const busy = data.busy_days.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Visão geral"
        subtitle={formatDateHeading(data.today)}
        action={
          <Link href="/painel" className={buttonClasses("primary", "md")}>
            <MapIcon size={18} /> Abrir o salão
          </Link>
        }
      />

      <section aria-labelledby="hoje-title">
        <h2 id="hoje-title" className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Hoje <span className="font-normal normal-case tracking-normal">· comparado com {weekdayShortLabel(data.today).toLowerCase()} passada</span>
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            icon={<CalendarIcon size={22} />}
            label="Reservas"
            value={day.reservations}
            tone="brand"
            deltaPercent={percentChange(day.reservations, lastWeekDay.reservations)}
            goodDirection="up"
            series={spark((d) => d.reservations)}
          />
          <StatTile
            icon={<PeopleIcon size={22} />}
            label="Pessoas esperadas"
            value={day.people}
            tone="brand"
            deltaPercent={percentChange(day.people, lastWeekDay.people)}
            goodDirection="up"
            series={spark((d) => d.people)}
          />
          <StatTile
            icon={<ChartIcon size={22} />}
            label="Ocupação das mesas"
            value={pct(day.occupancy)}
            tone="blue"
            deltaPercent={percentChange(day.occupancy, lastWeekDay.occupancy)}
            goodDirection="up"
            series={spark((d) => d.occupancy ?? 0)}
          />
          <StatTile
            icon={<AlertIcon size={22} />}
            label="Faltas · cancelamentos"
            value={`${day.no_shows} · ${day.cancelled}`}
            tone="red"
          />
        </div>
      </section>

      <section aria-labelledby="semana-title">
        <h2 id="semana-title" className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Últimos 7 dias <span className="font-normal normal-case tracking-normal">· comparado com os 7 dias anteriores</span>
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CompareTile label="Reservas" current={week.reservations} previous={prevWeek.reservations} versus={VS} />
          <CompareTile label="Pessoas" current={week.people} previous={prevWeek.people} versus={VS} />
          <CompareTile label="Ocupação" current={week.occupancy} previous={prevWeek.occupancy} percent versus={VS} />
          <CompareTile label="Taxa de faltas" current={week.no_show_rate} previous={prevWeek.no_show_rate} percent goodDown versus={VS} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ChartCard
          title="Reservas por dia"
          subtitle="Últimas 4 semanas e próximos 14 dias"
          legend={[
            { label: "Dias que já passaram", swatch: "bg-brand-ink" },
            { label: "Próximos dias (reservas feitas até agora)", swatch: "bg-brand-ink/40" },
          ]}
          table={{
            columns: ["Dia", "Reservas", "Pessoas", "Ocupação"],
            rows: data.daily.map((d) => [formatWeekdayDateShort(d.day), d.reservations, d.people, pct(d.occupancy)]),
          }}
        >
          <BarChart bars={bars} tickEvery={7} ariaLabel="Reservas por dia" />
        </ChartCard>

        <ChartCard
          title="Horários de pico"
          subtitle={
            peak
              ? `Pessoas por horário de chegada, últimos 30 dias. Pico às ${peak.hour}h (${formatPercent((peak.people / Math.max(1, totalHourPeople)) * 100)} das pessoas).`
              : "Pessoas por horário de chegada, últimos 30 dias."
          }
          table={{
            columns: ["Horário", "Reservas", "Pessoas"],
            rows: hours.map((h) => [`${h.hour}h`, h.reservations, h.people]),
          }}
        >
          <BarChart
            ariaLabel="Pessoas por horário de chegada"
            bars={hours.map((h) => ({
              key: String(h.hour),
              label: `${h.hour}h`,
              value: h.people,
              valueLabel: `${h.people} pessoas · ${h.reservations} reservas`,
              detail: `Chegada às ${h.hour}h`,
            }))}
          />
        </ChartCard>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Próximas datas mais cheias</h2>
        <p className="mt-0.5 text-sm text-stone-500">
          Ocupação das mesas com as reservas já feitas (próximas 3 semanas).
        </p>
        {busy.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Nenhuma data com movimento acima do normal por enquanto.</p>
        ) : (
          <div className="mt-4">
            <MeterList
              ariaLabel="Próximas datas mais cheias"
              items={busy.map((d) => ({
                key: d.day,
                label: formatWeekdayDateShort(d.day),
                share: d.occupancy ?? 0,
                value: `${pct(d.occupancy)} · ${d.reservations} reservas · ${d.people} pessoas`,
              }))}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
