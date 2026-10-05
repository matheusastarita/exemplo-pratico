import type { ReactNode } from "react";
import { Card } from "./Card";
import { Sparkline } from "./Sparkline";
import { TrendIcon } from "@/components/icons";

type Tone = "green" | "gold" | "red" | "brand" | "blue";

const TONE_TEXT: Record<Tone, string> = {
  green: "text-status-confirmed",
  gold: "text-status-pending",
  red: "text-status-no-show",
  brand: "text-brand-ink",
  blue: "text-status-seated",
};

/** Indicador: ícone, número, título, variação e mini gráfico (dados reais). */
export function StatTile({
  icon,
  label,
  value,
  tone,
  deltaPercent,
  deltaHint,
  goodDirection,
  series,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: Tone;
  /** null/undefined = sem base de comparação, então não mostra nada. */
  deltaPercent?: number | null;
  deltaHint?: string;
  /** Qual sentido é "bom" (define verde/vermelho da variação). Sem isso, usa a cor do card. */
  goodDirection?: "up" | "down";
  series?: number[];
}) {
  const toneText = TONE_TEXT[tone];
  const hasDelta = deltaPercent !== null && deltaPercent !== undefined;
  const deltaTone =
    hasDelta && goodDirection && deltaPercent !== 0
      ? (deltaPercent > 0) === (goodDirection === "up")
        ? TONE_TEXT.green
        : TONE_TEXT.red
      : "text-stone-500";

  return (
    <Card padding="none" className="relative flex flex-col gap-3 px-5 py-5">
      <span className={toneText}>{icon}</span>
      <div>
        <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-stone-900">
          {value}
        </p>
        <p className="mt-2 text-sm text-stone-500">{label}</p>
      </div>
      <p className={`flex min-h-5 items-center gap-1 text-xs font-medium ${deltaTone}`}>
        {hasDelta && (
          <>
            <TrendIcon direction={deltaPercent >= 0 ? "up" : "down"} size={13} />
            {Math.abs(deltaPercent)}%
            {deltaHint && <span className="font-normal text-stone-500">{deltaHint}</span>}
          </>
        )}
      </p>
      {series && series.length > 1 && (
        <Sparkline
          values={series}
          className={`absolute bottom-5 right-5 h-9 w-20 xl:w-24 ${toneText}`}
        />
      )}
    </Card>
  );
}
