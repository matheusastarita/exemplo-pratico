import { cn } from "@/lib/utils";

/** Topo das páginas internas: azul-marinho com a grade fina e o brilho da marca. */
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
    <section className={cn("dark relative isolate overflow-hidden bg-background text-foreground", className)}>
      <div
        aria-hidden="true"
        className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_70%_70%_at_75%_20%,#000,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-1/3 -right-1/4 -z-10 aspect-square w-[min(95vw,1100px)] rounded-full bg-[radial-gradient(closest-side,rgba(43,75,122,0.6),rgba(29,55,95,0.2)_55%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-20 -z-10 size-96 rounded-full bg-[radial-gradient(closest-side,rgba(201,240,60,0.14),transparent)]"
      />
      <div
        className={cn(
          "wrap pt-40 pb-20 md:pt-48 md:pb-28",
          aside && "grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:items-end"
        )}
      >
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-6 max-w-[16ch] text-hero font-bold tracking-[-0.045em]">{title}</h1>
          {lede ? <p className="mt-8 max-w-[52ch] text-lede text-muted-foreground">{lede}</p> : null}
          {children ? <div className="mt-10">{children}</div> : null}
        </div>
        {aside}
      </div>
    </section>
  );
}
