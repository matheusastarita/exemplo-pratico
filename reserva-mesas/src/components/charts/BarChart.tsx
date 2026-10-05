"use client";

import { useState } from "react";

export type BarDatum = {
  key: string;
  /** Rótulo curto do eixo X (pode ser omitido em parte das barras). */
  label: string;
  value: number;
  /** Texto do valor no tooltip (ex.: "44 reservas"). */
  valueLabel: string;
  /** Linha secundária do tooltip (ex.: "Seg, 5 de outubro"). */
  detail?: string;
  /** Tom claro (ex.: dias futuros, com reservas ainda entrando). */
  muted?: boolean;
  /** Destaca o rótulo do eixo (ex.: hoje). */
  current?: boolean;
};

/** Teto "redondo" para o eixo Y: 1, 2, 5 × 10^n. */
function niceCeil(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/**
 * Barras verticais de uma série só (magnitude ao longo do tempo/categorias).
 * Especificação do skill de dataviz: barra fina (≤ 24px), ponta arredondada de
 * 4px e base reta, 2px de espaço entre barras, grade em linha fina sólida,
 * tooltip no hover e no foco do teclado. A cor é a "tinta" da marca (contraste
 * garantido com o fundo branco); o tom claro vem acompanhado de legenda e tabela.
 */
export function BarChart({
  bars,
  height = 180,
  tickEvery = 1,
  yFormat = (n) => n.toLocaleString("pt-BR"),
  ariaLabel,
}: {
  bars: BarDatum[];
  height?: number;
  tickEvery?: number;
  yFormat?: (n: number) => string;
  ariaLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceCeil(Math.max(0, ...bars.map((b) => b.value)));
  const ticks = [max, max / 2, 0];
  const n = bars.length;
  const hovered = active !== null ? bars[active] : null;
  const currentIndex = bars.findIndex((b) => b.current);

  return (
    <div className="flex gap-2" onPointerLeave={() => setActive(null)}>
      {/* eixo Y */}
      <div className="relative w-9 shrink-0 text-right text-[11px] text-stone-500" style={{ height }} aria-hidden="true">
        {ticks.map((t, i) => (
          <span key={t} className="absolute right-0 -translate-y-1/2 tabular-nums" style={{ top: `${(i / 2) * 100}%` }}>
            {yFormat(t)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height }}>
          {/* grade: linhas finas, sólidas, discretas */}
          {ticks.map((t, i) => (
            <span
              key={t}
              aria-hidden="true"
              className={`absolute inset-x-0 h-px ${t === 0 ? "bg-stone-300" : "bg-stone-200/80"}`}
              style={{ top: `${(i / 2) * 100}%` }}
            />
          ))}

          <ul className="absolute inset-0 flex items-end gap-[2px]" aria-label={ariaLabel}>
            {bars.map((b, i) => {
              const pct = max > 0 ? (b.value / max) * 100 : 0;
              return (
                <li
                  key={b.key}
                  tabIndex={0}
                  aria-label={`${b.detail ?? b.label}: ${b.valueLabel}`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((a) => (a === i ? null : a))}
                  className="group flex h-full min-w-0 flex-1 cursor-default items-end justify-center outline-none"
                >
                  <span
                    className={`block w-full max-w-6 rounded-t-[4px] transition-opacity ${
                      b.muted ? "bg-brand-ink/40" : "bg-brand-ink"
                    } ${active !== null && active !== i ? "opacity-60" : ""} group-focus-visible:ring-2 group-focus-visible:ring-brand group-focus-visible:ring-offset-2`}
                    style={{ height: `${Math.max(pct, b.value > 0 ? 1.5 : 0)}%` }}
                  />
                </li>
              );
            })}
          </ul>

          {hovered && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-stone-200 bg-white px-3 py-2 text-left shadow-elevated"
              style={{
                left: `${Math.min(88, Math.max(12, ((active + 0.5) / n) * 100))}%`,
                top: `calc(${100 - (max > 0 ? (hovered.value / max) * 100 : 0)}% - 8px)`,
              }}
            >
              <p className="text-sm font-semibold text-stone-900">{hovered.valueLabel}</p>
              <p className="text-xs text-stone-500">{hovered.detail ?? hovered.label}</p>
            </div>
          )}
        </div>

        {/* eixo X: rótulos espaçados para não colidirem (os vizinhos do "atual" somem) */}
        <div className="mt-1.5 flex gap-[2px]" aria-hidden="true">
          {bars.map((b, i) => {
            const nearCurrent = currentIndex >= 0 && i !== currentIndex && Math.abs(i - currentIndex) <= Math.max(2, Math.ceil(tickEvery / 2));
            const show = b.current || (i % tickEvery === 0 && !nearCurrent);
            return (
              <span
                key={b.key}
                className={`min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[10px] ${
                  b.current ? "font-semibold text-stone-900" : "text-stone-500"
                }`}
              >
                {show ? b.label : ""}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
