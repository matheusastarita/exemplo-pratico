"use client";

import { MinusIcon, PlusIcon } from "@/components/icons";

/** Nº de pessoas com botões grandes (uso de pé, com uma mão) + atalhos. */
export function PartyStepper({
  value,
  onChange,
  max = 30,
  quick = [1, 2, 3, 4, 5, 6, 8],
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  quick?: number[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          aria-label="Menos uma pessoa"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 disabled:opacity-40"
        >
          <MinusIcon size={22} />
        </button>
        <p className="min-w-24 text-center" aria-live="polite">
          <span className="block text-4xl font-bold tabular-nums text-stone-900">{value}</span>
          <span className="text-sm text-stone-500">{value === 1 ? "pessoa" : "pessoas"}</span>
        </p>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Mais uma pessoa"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 disabled:opacity-40"
        >
          <PlusIcon size={22} />
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {quick.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={n === value}
            className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold ${
              n === value ? "bg-brand text-brand-contrast" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
