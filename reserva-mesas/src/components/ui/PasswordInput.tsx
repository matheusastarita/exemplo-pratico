"use client";

import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/icons";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
};

/** Campo de senha com ícone de cadeado e botão pra mostrar/esconder o texto digitado. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, id, className = "", ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="px-1 text-sm font-medium text-stone-600">
            {label}
          </label>
        )}
        <div className="relative">
          <LockIcon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={error ? true : undefined}
            className={`w-full rounded-control border bg-stone-50/80 py-3 pl-11 pr-12 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:text-stone-500 ${
              error ? "border-red-400" : "border-stone-200"
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Esconder senha" : "Mostrar senha"}
            aria-pressed={visible}
            className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 hover:text-stone-600"
          >
            {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>
        {error && <p className="px-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
