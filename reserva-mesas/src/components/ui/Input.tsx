import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const FIELD_CLASSES =
  "w-full rounded-control border bg-stone-50/80 px-4 py-3 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:text-stone-500";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className = "", ...props },
  ref
) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="px-1 text-sm font-medium text-stone-600">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${FIELD_CLASSES} ${error ? "border-red-400" : "border-stone-200"} ${className}`}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="px-1 text-xs text-stone-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="px-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className = "", rows = 3, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="px-1 text-sm font-medium text-stone-600">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={`${FIELD_CLASSES} resize-y ${error ? "border-red-400" : "border-stone-200"} ${className}`}
        {...props}
      />
      {hint && !error && <p className="px-1 text-xs text-stone-500">{hint}</p>}
      {error && <p className="px-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});
