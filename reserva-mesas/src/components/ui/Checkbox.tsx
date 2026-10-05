import type { InputHTMLAttributes, ReactNode } from "react";

/** Checkbox com rótulo clicável e área de toque confortável. */
export function Checkbox({
  label,
  hint,
  id,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; hint?: string }) {
  return (
    <label htmlFor={id} className={`flex min-h-tap cursor-pointer items-start gap-3 py-1.5 text-sm text-stone-700 ${className}`}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-stone-300 accent-[rgb(var(--c-brand))]"
        {...props}
      />
      <span>
        {label}
        {hint && <span className="mt-0.5 block text-xs text-stone-500">{hint}</span>}
      </span>
    </label>
  );
}
