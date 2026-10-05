import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  lede,
  className,
  titleAs: Title = "h2",
  titleId,
  align = "start",
}: {
  eyebrow: string;
  titleId?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  className?: string;
  titleAs?: "h1" | "h2";
  align?: "start" | "split";
}) {
  return (
    <div
      className={cn(
        align === "split" ? "grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16" : "max-w-3xl",
        className
      )}
    >
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <Title id={titleId} className="mt-5 text-display font-extrabold tracking-[-0.04em]">{title}</Title>
      </div>
      {lede ? (
        <p className={cn("text-lede text-muted-foreground", align === "split" ? "max-w-[44ch]" : "mt-6 max-w-[48ch]")}>
          {lede}
        </p>
      ) : null}
    </div>
  );
}
