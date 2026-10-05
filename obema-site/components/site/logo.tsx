import { cn } from "@/lib/utils";

/** Marca OBEMA: o anel verde-limão no lugar do "O", como no site atual. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "group/logo inline-flex items-center gap-[0.3em] font-display text-xl font-extrabold tracking-[-0.02em]",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="inline-block size-[0.82em] rounded-full border-[0.2em] border-lime transition-transform duration-700 ease-brand group-hover/logo:scale-x-[0.45]"
      />
      OBEMA
    </span>
  );
}
