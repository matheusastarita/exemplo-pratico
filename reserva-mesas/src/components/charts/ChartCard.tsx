"use client";

import { useId, useState } from "react";
import { Card } from "@/components/ui/Card";

export type ChartTable = { columns: string[]; rows: (string | number)[][] };

/**
 * Moldura de gráfico: título, legenda (quando há mais de um tom) e a "tabela"
 * equivalente — todo gráfico tem a versão em tabela (acessibilidade e números exatos).
 */
export function ChartCard({
  title,
  subtitle,
  legend,
  table,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  legend?: { label: string; swatch: string }[];
  table: ChartTable;
  children: React.ReactNode;
  className?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();

  return (
    <Card className={className}>
      <figure aria-labelledby={titleId}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <figcaption id={titleId} className="text-base font-semibold text-stone-900">
              {title}
            </figcaption>
            {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            className="min-h-9 shrink-0 rounded-full border border-stone-200 px-3 text-xs font-medium text-stone-600 hover:bg-stone-50"
          >
            {showTable ? "Ver gráfico" : "Ver tabela"}
          </button>
        </div>

        {legend && legend.length > 1 && !showTable && (
          <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
            {legend.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`h-2.5 w-3.5 rounded-sm ${l.swatch}`} />
                {l.label}
              </li>
            ))}
          </ul>
        )}

        {showTable ? (
          <div className="max-h-80 overflow-auto rounded-control border border-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="px-3 py-2 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {table.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className={`px-3 py-2 ${j > 0 ? "tabular-nums" : ""} text-stone-800`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </figure>
    </Card>
  );
}
