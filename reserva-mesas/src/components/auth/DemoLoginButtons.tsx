"use client";

import { useState, useTransition } from "react";
import { demoSignIn } from "@/app/demo-actions";

const OPTIONS = [
  { role: "manager", label: "Gerente" },
  { role: "host", label: "Anfitrião" },
  { role: "client", label: "Cliente" },
] as const;

/** Botões "Entrar como ..." — o servidor só renderiza isto com NEXT_PUBLIC_DEMO_MODE=true. */
export function DemoLoginButtons() {
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function enter(role: (typeof OPTIONS)[number]["role"]) {
    setError(null);
    setActive(role);
    startTransition(async () => {
      const result = await demoSignIn(role);
      if (result?.error) {
        setError(result.error);
        setActive(null);
      }
    });
  }

  return (
    <div className="mt-8 rounded-card border border-dashed border-stone-300 bg-white/70 p-4">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-stone-500">
        Demonstração — entrar como
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.role}
            type="button"
            disabled={pending}
            onClick={() => enter(opt.role)}
            className="min-h-tap rounded-full border border-stone-200 bg-white px-2 text-sm font-medium text-stone-800 transition-colors hover:border-brand hover:text-brand-ink disabled:opacity-60"
          >
            {pending && active === opt.role ? "Entrando..." : opt.label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
