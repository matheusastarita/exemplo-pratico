"use client";

/** Número de pessoas: 1..max em botões grandes + "Mais de max" (grupo grande -> fale conosco). */
export function PartyPicker({
  max,
  value,
  onSelect,
  onLargeGroup,
  largeSelected,
}: {
  max: number;
  value: number | null;
  onSelect: (n: number) => void;
  onLargeGroup: () => void;
  largeSelected: boolean;
}) {
  const options = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div role="radiogroup" aria-label="Número de pessoas" className="grid grid-cols-5 gap-2 sm:grid-cols-6">
      {options.map((n) => {
        const active = n === value && !largeSelected;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={n === 1 ? "1 pessoa" : `${n} pessoas`}
            onClick={() => onSelect(n)}
            className={`flex h-14 items-center justify-center rounded-control border text-lg font-semibold transition-all active:scale-[0.97] ${
              active
                ? "border-brand bg-brand text-brand-contrast shadow-md shadow-brand/25"
                : "border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50"
            }`}
          >
            {n}
          </button>
        );
      })}
      <button
        type="button"
        role="radio"
        aria-checked={largeSelected}
        onClick={onLargeGroup}
        className={`col-span-5 flex h-12 items-center justify-center rounded-control border px-3 text-sm font-medium transition-colors sm:col-span-6 ${
          largeSelected
            ? "border-brand bg-brand-soft text-brand-ink"
            : "border-dashed border-stone-300 bg-white text-stone-600 hover:bg-stone-50"
        }`}
      >
        Mais de {max} pessoas
      </button>
    </div>
  );
}
