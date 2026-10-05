/** Aviso discreto de ambiente de demonstração (rodapé). */
export function DemoNotice({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <p className={`text-center text-xs ${tone === "light" ? "text-white/70" : "text-stone-500"}`}>
      Ambiente de demonstração — restaurante, clientes e mensagens são fictícios.
    </p>
  );
}

/** Selo pequeno para marcar algo simulado (mensagem, pagamento do sinal). */
export function SimulatedBadge({ label = "Simulado na demonstração" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
      {label}
    </span>
  );
}
