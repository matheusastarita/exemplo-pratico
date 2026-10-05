import { marqueeItems } from "@/lib/content";
import { cn } from "@/lib/utils";

export function Marquee() {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {marqueeItems.map((item, i) => (
        <li key={item} className="flex items-center">
          <span
            className={cn(
              "px-6 font-display text-[clamp(1.5rem,1rem+2vw,2.75rem)] font-extrabold tracking-[-0.03em] whitespace-nowrap md:px-10",
              i % 2 === 1 && "text-slate-accent"
            )}
          >
            {item}
          </span>
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-navy" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="O que a OBEMA entrega" className="marquee overflow-hidden border-y border-border bg-background py-6 md:py-8">
      <div className="marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
