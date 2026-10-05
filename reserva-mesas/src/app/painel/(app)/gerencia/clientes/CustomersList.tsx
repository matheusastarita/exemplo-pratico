"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterPills } from "@/components/ui/FilterPills";
import { SearchInput } from "@/components/ui/SearchInput";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ChevronIcon, DownloadIcon, PeopleIcon } from "@/components/icons";
import { dayMonthLabel, formatWeekdayDateShort } from "@/lib/dates";
import { formatPhone, pluralize } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import type { CustomerSummary } from "@/lib/types";

// "Sumido" = já veio pelo menos uma vez, a última visita foi há mais de 60 dias
// e não tem reserva marcada.
const INACTIVE_DAYS = 60;
const FREQUENT_MIN_VISITS = 3;
const PAGE = 100;

type Filter = "all" | "frequent" | "inactive" | "no_shows" | "vip" | "birthday" | "blocked";

function daysBetween(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split("-").map(Number);
  const [y2, m2, d2] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

function sinceLabel(days: number): string {
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export function CustomersList({ customers, today }: { customers: CustomerSummary[]; today: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE);
  const month = today.slice(5, 7);

  const tests = useMemo<Record<Filter, (c: CustomerSummary) => boolean>>(
    () => ({
      all: () => true,
      frequent: (c) => c.visits >= FREQUENT_MIN_VISITS,
      inactive: (c) => !!c.last_visit && daysBetween(c.last_visit, today) > INACTIVE_DAYS && !c.next_reservation,
      no_shows: (c) => c.no_shows > 0,
      vip: (c) => c.tags.includes("VIP"),
      birthday: (c) => !!c.birthday && c.birthday.slice(5, 7) === month,
      blocked: (c) => c.blocked,
    }),
    [today, month]
  );

  const options = useMemo(() => {
    const labels: [Filter, string][] = [
      ["all", "Todos"],
      ["frequent", "Mais frequentes"],
      ["inactive", "Sumidos há 60+ dias"],
      ["no_shows", "Com faltas"],
      ["vip", "VIP"],
      ["birthday", "Aniversariantes do mês"],
      ["blocked", "Bloqueados"],
    ];
    return labels.map(([key, label]) => ({ key, label, count: customers.filter(tests[key]).length }));
  }, [customers, tests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const list = customers.filter(
      (c) =>
        tests[filter](c) &&
        (!q ||
          c.full_name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (digits.length >= 3 && (c.phone ?? "").includes(digits)))
    );
    // Cada filtro tem a ordem que responde à pergunta dele
    if (filter === "frequent") return [...list].sort((a, b) => b.visits - a.visits);
    if (filter === "inactive") return [...list].sort((a, b) => (a.last_visit ?? "").localeCompare(b.last_visit ?? ""));
    if (filter === "no_shows") return [...list].sort((a, b) => b.no_shows - a.no_shows);
    if (filter === "birthday") return [...list].sort((a, b) => (a.birthday ?? "").slice(8).localeCompare((b.birthday ?? "").slice(8)));
    return list;
  }, [customers, query, filter, tests]);

  function exportCSV() {
    downloadCSV(
      `clientes-${today}.csv`,
      [
        "Nome",
        "Telefone",
        "E-mail",
        "Tags",
        "Visitas",
        "Pessoas trazidas",
        "Faltas",
        "Cancelamentos",
        "Última visita",
        "Próxima reserva",
        "Aniversário",
        "Aceita novidades",
        "Bloqueado",
      ],
      filtered.map((c) => [
        c.full_name,
        formatPhone(c.phone),
        c.email ?? "",
        c.tags.join(", "),
        c.visits,
        c.people,
        c.no_shows,
        c.cancellations,
        c.last_visit ? c.last_visit.split("-").reverse().join("/") : "",
        c.next_reservation ? c.next_reservation.split("-").reverse().join("/") : "",
        c.birthday ? c.birthday.slice(5).split("-").reverse().join("/") : "",
        c.marketing_consent ? "Sim" : "Não",
        c.blocked ? "Sim" : "Não",
      ])
    );
  }

  const visible = filtered.slice(0, limit);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Clientes"
        subtitle={`${pluralize(customers.length, "cliente", "clientes")} cadastrados`}
        action={
          <Button variant="secondary" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <DownloadIcon size={16} /> Exportar CSV
          </Button>
        }
      />

      <div className="-mt-2 flex flex-col gap-3">
        <SearchInput
          placeholder="Nome, telefone ou e-mail"
          aria-label="Buscar cliente"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          className="sm:max-w-md"
        />
        <FilterPills
          options={options}
          value={filter}
          onChange={(f) => {
            setFilter(f);
            setLimit(PAGE);
          }}
          label="Filtrar clientes"
          scrollOnMobile
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<PeopleIcon size={22} />}
          title={customers.length === 0 ? "Nenhum cliente ainda" : "Ninguém por aqui"}
          message={
            customers.length === 0
              ? "Os clientes aparecem aqui assim que fizerem a primeira reserva."
              : query
                ? "Nenhum cliente com essa busca nesse filtro."
                : "Nenhum cliente se encaixa nesse filtro agora."
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))_20px] gap-4 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-stone-500 md:grid"
          >
            <span>Cliente</span>
            <span>Visitas</span>
            <span>Faltas</span>
            <span>Última visita</span>
            <span>Próxima reserva</span>
            <span />
          </div>
          <ul className="divide-y divide-stone-100">
            {visible.map((c) => {
              const since = c.last_visit ? daysBetween(c.last_visit, today) : null;
              const birthdayThisMonth = !!c.birthday && c.birthday.slice(5, 7) === month;
              return (
                <li key={c.id}>
                  <Link
                    href={`/painel/gerencia/clientes/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-stone-50 focus-visible:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand md:grid md:grid-cols-[minmax(0,2.4fr)_repeat(4,minmax(0,1fr))_20px] md:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={c.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate text-sm font-semibold text-stone-900">{c.full_name}</span>
                          {c.tags.includes("VIP") && <Badge tone="brand">VIP</Badge>}
                          {c.blocked && <Badge tone="no_show">Bloqueado</Badge>}
                          {birthdayThisMonth && <Badge tone="warning">Aniversário {dayMonthLabel(c.birthday!)}</Badge>}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {formatPhone(c.phone) || c.email || "Sem contato"}
                          {/* No celular, o resumo vai na mesma célula */}
                          <span className="md:hidden">
                            {" · "}
                            {c.visits === 0 ? "nunca veio" : pluralize(c.visits, "visita", "visitas")}
                            {since !== null && ` · última ${sinceLabel(since)}`}
                            {c.no_shows > 0 && ` · ${pluralize(c.no_shows, "falta", "faltas")}`}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="hidden text-sm tabular-nums text-stone-700 md:block">{c.visits}</span>
                    <span className={`hidden text-sm tabular-nums md:block ${c.no_shows > 0 ? "font-medium text-status-no-show" : "text-stone-500"}`}>
                      {c.no_shows}
                    </span>
                    <span className="hidden text-sm text-stone-600 md:block">
                      {c.last_visit ? (
                        <>
                          {dayMonthLabel(c.last_visit)}
                          <span className="block text-xs text-stone-500">{sinceLabel(since ?? 0)}</span>
                        </>
                      ) : (
                        <span className="text-stone-500">Nunca veio</span>
                      )}
                    </span>
                    <span className="hidden text-sm text-stone-600 md:block">
                      {c.next_reservation ? formatWeekdayDateShort(c.next_reservation) : <span className="text-stone-500">—</span>}
                    </span>
                    <ChevronIcon direction="right" size={18} className="shrink-0 text-stone-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {filtered.length > limit && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
            Mostrar mais ({filtered.length - limit} restantes)
          </Button>
        </div>
      )}
    </div>
  );
}
