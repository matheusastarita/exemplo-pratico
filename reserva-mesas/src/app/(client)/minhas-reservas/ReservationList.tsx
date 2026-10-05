"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CalendarIcon, ChevronIcon, ClockIcon, PeopleIcon, RefreshIcon } from "@/components/icons";
import { formatDateFull, formatWeekdayDateShort, minutesUntil } from "@/lib/dates";
import { peopleLabel } from "@/lib/format";
import { OCCASION_LABEL } from "@/lib/constants";
import { customerStatusLabel, rememberPhone } from "@/lib/reservas";
import type { MyReservation } from "@/lib/types";

function isUpcoming(r: MyReservation) {
  return (r.status === "pending" || r.status === "confirmed" || r.status === "seated") && minutesUntil(r.date, r.end_time) > 0;
}

function repeatHref(r: MyReservation) {
  const params = new URLSearchParams({ pessoas: String(r.party_size) });
  if (r.area_preference) params.set("area", r.area_preference);
  return `/reservar?${params.toString()}`;
}

export function ReservationList({ reservations }: { reservations: MyReservation[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"proximas" | "historico">("proximas");
  const upcoming = reservations
    .filter(isUpcoming)
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const history = reservations.filter((r) => !isUpcoming(r));
  const list = tab === "proximas" ? upcoming : history;
  const next = upcoming[0] ?? null;

  function open(r: MyReservation) {
    rememberPhone(r.code, r.phone);
    router.push(`/r/${r.code}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {next ? (
        <section aria-label="Próxima reserva" className="rounded-card bg-brand p-5 text-brand-contrast shadow-elevated">
          <p className="text-xs font-medium uppercase tracking-widest opacity-75">Próxima reserva</p>
          <p className="mt-2 font-serif text-2xl font-bold">{formatDateFull(next.date)}</p>
          <p className="mt-1 opacity-85">
            {next.start_time} · {peopleLabel(next.party_size)}
            {next.area_name ? ` · ${next.area_name}` : ""}
          </p>
          <button
            type="button"
            onClick={() => open(next)}
            className="mt-4 inline-flex min-h-tap items-center gap-1.5 rounded-full bg-white/15 px-4 text-sm font-medium hover:bg-white/25"
          >
            Ver, alterar ou cancelar <ChevronIcon direction="right" size={16} />
          </button>
        </section>
      ) : (
        <EmptyState
          icon={<CalendarIcon size={22} />}
          title="Nenhuma reserva marcada"
          message="Escolha um dia e garanta sua mesa em menos de um minuto."
          action={
            <Link href="/reservar" className={buttonClasses("primary", "md")}>
              Reservar mesa
            </Link>
          }
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Filtrar reservas"
          value={tab}
          onChange={setTab}
          options={[
            { key: "proximas", label: "Próximas", badge: upcoming.length },
            { key: "historico", label: "Histórico", badge: history.length },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState
          compact
          message={tab === "proximas" ? "Você não tem outras reservas futuras." : "Seu histórico aparece aqui depois da primeira visita."}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((r) => (
            <li key={r.code}>
              <Card padding="sm" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-stone-900">{formatWeekdayDateShort(r.date)}</p>
                    <Badge tone={r.status}>{customerStatusLabel(r.status)}</Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
                    <span className="flex items-center gap-1">
                      <ClockIcon size={15} /> {r.start_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <PeopleIcon size={15} /> {peopleLabel(r.party_size)}
                    </span>
                    {r.occasion && <span>{OCCASION_LABEL[r.occasion]}</span>}
                  </p>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  {tab === "historico" ? (
                    <Link href={repeatHref(r)} className={buttonClasses("secondary", "sm", "min-h-tap")}>
                      <RefreshIcon size={16} /> Repetir
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => open(r)}
                    className={buttonClasses(tab === "historico" ? "ghost" : "secondary", "sm", "min-h-tap")}
                  >
                    Detalhes
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
