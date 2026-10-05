import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, className = "", children, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="px-1 text-sm font-medium text-stone-600">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-control border bg-stone-50/80 px-4 py-3 text-sm text-stone-900 transition-colors focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/15 ${
          error ? "border-red-400" : "border-stone-200"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="px-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});
