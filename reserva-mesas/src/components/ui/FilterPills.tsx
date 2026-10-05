type Option<T extends string> = { key: T; label: string; count?: number };

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
  scrollOnMobile = false,
}: {
  options: Option<T>[];
  value: T;
  onChange: (key: T) => void;
  label?: string;
  /** No celular, uma faixa só com rolagem lateral em vez de quebrar em várias linhas. */
  scrollOnMobile?: boolean;
}) {
  return (
    <div
      className={
        scrollOnMobile
          ? "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
          : "flex flex-wrap gap-2"
      }
      role="group"
      aria-label={label}
    >
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            aria-pressed={active}
            className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-brand text-brand-contrast shadow-sm shadow-brand/30"
                : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  active ? "bg-white/20" : "bg-stone-100 text-stone-500"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
