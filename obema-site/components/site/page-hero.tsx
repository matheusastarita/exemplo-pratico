import { cn } from "@/lib/utils";

/** Topo das páginas internas: branco, título grande em azul-marinho. */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  aside,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  /** Visual opcional à direita, em telas largas. */
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-border bg-background", className)}>
      <div
        className={cn(
          "wrap pt-36 pb-16 md:pt-44 md:pb-24",
          aside && "grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:items-end"
        )}
      >
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-8 max-w-[15ch] font-display text-[clamp(2.75rem,0.7rem+5.4vw,6.5rem)] leading-[1.02] font-extrabold tracking-[-0.045em]">
            {title}
          </h1>
          {lede ? <p className="mt-8 max-w-[52ch] text-lede text-muted-foreground">{lede}</p> : null}
          {children ? <div className="mt-10">{children}</div> : null}
        </div>
        {aside}
      </div>
    </section>
  );
}
