export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
  stretch = false,
}: {
  options: { key: T; label: string; badge?: number }[];
  value: T;
  onChange: (key: T) => void;
  label: string;
  className?: string;
  /** Ocupa a largura toda, com opções do mesmo tamanho (bom no celular). */
  stretch?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`${stretch ? "flex w-full" : "inline-flex"} rounded-control border border-stone-200 bg-white p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.key)}
            className={`${stretch ? "flex-1" : ""} inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[0.6rem] px-4 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-brand text-brand-contrast" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {opt.label}
            {opt.badge !== undefined && opt.badge > 0 && (
              <span
                className={`min-w-5 rounded-full px-1.5 text-xs ${
                  active ? "bg-white/25" : "bg-stone-100 text-stone-600"
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
