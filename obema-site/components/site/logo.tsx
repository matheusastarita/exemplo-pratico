import { cn } from "@/lib/utils";

/** Marca OBEMA: só a palavra, em Archivo bem pesada. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-xl font-extrabold tracking-[-0.02em]", className)}>OBEMA</span>
  );
}
