import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "ghost-light" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-contrast hover:bg-brand-dark disabled:bg-stone-300 disabled:text-white",
  secondary:
    "bg-white text-stone-900 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 disabled:text-stone-400",
  accent:
    "bg-accent text-white hover:bg-accent-dark disabled:bg-stone-200 disabled:text-stone-400",
  ghost: "bg-transparent text-stone-600 hover:bg-stone-100 disabled:text-stone-300",
  "ghost-light":
    "bg-transparent text-white/80 border border-white/20 hover:bg-white/10 disabled:text-white/40",
  danger:
    "bg-white text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50 disabled:text-red-300 disabled:border-red-100",
  success:
    "bg-status-confirmed text-white hover:brightness-95 disabled:bg-stone-300",
};

// Altura mínima de 44px nos tamanhos md/lg (alvo de toque confortável no celular).
const SIZE_CLASSES: Record<Size, string> = {
  sm: "min-h-9 px-3.5 py-2 text-sm",
  md: "min-h-tap px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", disabled, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});

/** Mesmo visual do Button, pra links (<a>/<Link>). */
export function buttonClasses(variant: Variant = "primary", size: Size = "md", className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all active:scale-[0.98] ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`;
}
