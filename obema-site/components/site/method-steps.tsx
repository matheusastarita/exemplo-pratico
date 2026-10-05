import { steps } from "@/lib/content";

export function MethodSteps() {
  return (
    <ol className="relative grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <li
          key={step.title}
          data-reveal
          className="relative flex flex-col rounded-xl border border-border bg-card p-6 md:p-7"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy font-display text-sm font-bold text-lime">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-navy/30 to-transparent" />
          </div>
          <h3 className="mt-8 text-xl font-bold tracking-tight">{step.title}</h3>
          <p className="mt-3 text-muted-foreground">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
