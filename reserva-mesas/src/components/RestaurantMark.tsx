import Image from "next/image";
import { initialsOf } from "@/components/ui/Avatar";

/**
 * Marca do restaurante dirigida por restaurant_settings: logo (se houver URL)
 * ou monograma com as iniciais na cor da marca, + nome em serifada.
 */
export function RestaurantMark({
  name,
  logoUrl,
  size = "md",
  tone = "dark",
  showName = true,
  subtitle,
}: {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  /** "dark" = texto escuro (fundo claro). "light" = texto claro (fundo da marca). */
  tone?: "dark" | "light";
  showName?: boolean;
  subtitle?: string | null;
}) {
  const box = { sm: 36, md: 44, lg: 64 }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-[26px] sm:text-[30px]" }[size];

  return (
    <span className="inline-flex min-w-0 items-center gap-3">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={box}
          height={box}
          unoptimized
          className="shrink-0 rounded-full bg-white object-cover"
          style={{ width: box, height: box }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{ width: box, height: box }}
          className={`flex shrink-0 items-center justify-center rounded-full font-serif font-bold ${
            tone === "light" ? "bg-white/15 text-brand-contrast ring-1 ring-white/30" : "bg-brand text-brand-contrast"
          } ${size === "lg" ? "text-xl" : "text-sm"}`}
        >
          {initialsOf(name)}
        </span>
      )}
      {showName && (
        <span className="min-w-0">
          <span
            className={`block truncate font-serif font-bold leading-tight ${text} ${
              tone === "light" ? "text-brand-contrast" : "text-stone-900"
            }`}
          >
            {name}
          </span>
          {subtitle && (
            <span
              className={`block truncate text-xs ${tone === "light" ? "text-brand-contrast opacity-75" : "text-stone-500"}`}
            >
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
