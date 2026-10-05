import type { ReactNode } from "react";

/** Estado vazio: ícone opcional, título, explicação curta e uma ação. */
export function EmptyState({
  title,
  message,
  icon,
  action,
  compact = false,
}: {
  title?: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-card border border-dashed border-stone-300 bg-white/60 text-center ${
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-10"
      }`}
    >
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
          {icon}
        </span>
      )}
      {title && <p className="text-base font-semibold text-stone-900">{title}</p>}
      <p className="max-w-sm text-sm text-stone-500">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Mensagem de erro amigável, com ação de tentar de novo. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-card border border-red-200 bg-red-50 px-6 py-8 text-center"
    >
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-tap rounded-full border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
