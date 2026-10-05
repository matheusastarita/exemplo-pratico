import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon: ReactNode;
};

/** Input com um ícone fixo à esquerda (ex.: e-mail). Pra senha, use `PasswordInput`. */
export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(function IconInput(
  { label, error, icon, id, className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="px-1 text-sm font-medium text-stone-600">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
          {icon}
        </span>
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-control border bg-stone-50/80 py-3 pl-11 pr-4 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:text-stone-500 ${
            error ? "border-red-400" : "border-stone-200"
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="px-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});
