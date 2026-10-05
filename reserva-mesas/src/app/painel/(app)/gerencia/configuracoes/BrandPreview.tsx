import type { CSSProperties } from "react";
import { RestaurantMark } from "@/components/RestaurantMark";
import { Badge } from "@/components/ui/Badge";
import { brandCssVariables, isValidHexColor } from "@/lib/brand";

/**
 * Prévia ao vivo: as variáveis da marca valem só dentro deste bloco, então dá para
 * experimentar cor, nome e logo sem mexer no resto do painel até salvar.
 */
export function BrandPreview({
  name,
  tagline,
  color,
  logoUrl,
}: {
  name: string;
  tagline: string;
  color: string;
  logoUrl: string | null;
}) {
  const style = (isValidHexColor(color) ? brandCssVariables(color) : {}) as CSSProperties;
  const displayName = name.trim() || "Seu restaurante";

  return (
    <div style={style} className="flex flex-col gap-3" aria-label="Pré-visualização da marca">
      {/* Página de reserva do cliente */}
      <div className="overflow-hidden rounded-card border border-stone-200 bg-[rgb(var(--c-stone-50))] shadow-sm">
        <div className="bg-brand px-4 py-4">
          <RestaurantMark name={displayName} logoUrl={logoUrl} tone="light" size="md" subtitle={tagline.trim() || null} />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="font-serif text-xl font-bold text-brand-ink">Reserve sua mesa</p>
          <div className="flex gap-2" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                  n === 2 ? "bg-brand text-brand-contrast" : "border border-stone-200 bg-white text-stone-700"
                }`}
              >
                {n}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2" aria-hidden="true">
            {["19:00", "19:15", "19:30", "19:45"].map((t, i) => (
              <span
                key={t}
                className={`rounded-control py-2 text-center text-sm font-medium tabular-nums ${
                  i === 2 ? "bg-brand text-brand-contrast" : "border border-stone-200 bg-white text-stone-700"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
          <span className="flex min-h-tap items-center justify-center rounded-full bg-brand px-5 text-sm font-medium text-brand-contrast">
            Confirmar reserva
          </span>
          <p className="text-center text-sm text-brand-ink underline underline-offset-2">Ver política de cancelamento</p>
        </div>
      </div>

      {/* Painel da equipe */}
      <div className="flex items-center gap-3 rounded-card bg-brand-dark px-4 py-3">
        <RestaurantMark name={displayName} logoUrl={logoUrl} tone="light" size="sm" subtitle="Painel do restaurante" />
        <span className="ml-auto">
          <Badge tone="brand">VIP</Badge>
        </span>
      </div>
    </div>
  );
}
