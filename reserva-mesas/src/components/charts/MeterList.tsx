export type MeterItem = {
  key: string;
  label: string;
  /** Comprimento da barra, 0–100. */
  share: number;
  /** Texto à direita (o número exato fica sempre visível, não só na barra). */
  value: string;
};

/**
 * Barras horizontais de uma série só (partes de um todo ou ocupação), com o valor
 * escrito ao lado — dá para ler sem depender da cor nem do comprimento.
 */
export function MeterList({ items, ariaLabel }: { items: MeterItem[]; ariaLabel: string }) {
  return (
    <ul className="flex flex-col gap-3" aria-label={ariaLabel}>
      {items.map((it) => (
        <li
          key={it.key}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[140px_minmax(0,1fr)_auto]"
        >
          <span className="truncate text-sm font-medium text-stone-900">{it.label}</span>
          <span
            className="order-3 col-span-2 h-2.5 overflow-hidden rounded-full bg-brand-soft sm:order-none sm:col-span-1"
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full bg-brand-ink"
              style={{ width: `${Math.max(0, Math.min(100, it.share))}%` }}
            />
          </span>
          <span className="text-right text-sm tabular-nums text-stone-600">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}
