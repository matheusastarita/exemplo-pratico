import type { ReactNode } from "react";

/** Título de página, com subtítulo e ação opcionais. */
export function SectionHeader({
  title,
  subtitle,
  action,
  serif = false,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Título em serifada (telas do cliente). */
  serif?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1
          className={
            serif
              ? "font-serif text-[28px] font-bold leading-tight text-brand-ink"
              : "text-xl font-semibold text-stone-900 sm:text-2xl"
          }
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/** Rótulo pequeno acima de um grupo de itens (ex.: "Próximas", "Histórico"). */
export function GroupLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{children}</h2>
      {action}
    </div>
  );
}
