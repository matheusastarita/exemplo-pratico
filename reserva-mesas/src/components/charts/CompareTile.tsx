import { Card } from "@/components/ui/Card";
import { formatPercent } from "@/lib/format";

/** Variação percentual; null quando não há base de comparação. */
export function percentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Número do período + variação contra o período anterior. Taxas (percent) comparam
 * em pontos percentuais; contagens, em %. goodDown = cair é bom (faltas, cancelamentos).
 */
export function CompareTile({
  label,
  current,
  previous,
  percent = false,
  goodDown = false,
  format,
  versus,
  note,
}: {
  label: string;
  current: number | null;
  previous: number | null;
  percent?: boolean;
  goodDown?: boolean;
  /** Formatação do valor (ex.: minutos -> "1h45"). */
  format?: (n: number) => string;
  /** Texto da comparação, ex.: "vs 7 dias anteriores". */
  versus: string;
  /** Linha extra abaixo do número (ex.: "12 faltas"). */
  note?: string;
}) {
  const delta = percent
    ? current !== null && previous !== null
      ? Math.round((current - previous) * 10) / 10
      : null
    : percentChange(current, previous);
  const good = delta === null || delta === 0 ? null : (delta > 0) !== goodDown;
  // Taxas pequenas com uma casa (2,6%), para casar com a variação em p.p.
  const rate = (n: number) => (n < 10 ? `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : formatPercent(n));
  const shown =
    current === null ? "—" : format ? format(current) : percent ? rate(current) : current.toLocaleString("pt-BR");

  return (
    <Card padding="sm" className="sm:p-5">
      <p className="text-xs text-stone-500 sm:text-sm">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-900 sm:text-2xl">{shown}</p>
      {note && <p className="text-xs text-stone-600">{note}</p>}
      <p className={`mt-0.5 text-xs ${good === null ? "text-stone-500" : good ? "text-status-confirmed" : "text-status-no-show"}`}>
        {delta === null
          ? "sem base de comparação"
          : delta === 0
            ? `igual · ${versus}`
            : `${delta > 0 ? "▲" : "▼"} ${Math.abs(delta).toLocaleString("pt-BR")}${percent ? " p.p." : "%"} ${versus}`}
      </p>
    </Card>
  );
}
