export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7 text-center">
      <h1 className="font-serif text-[32px] font-bold leading-tight text-brand-ink">{title}</h1>
      <p className="mt-2 text-[15px] text-stone-500">{subtitle}</p>
    </div>
  );
}

/** Divisor "ou" entre o botão principal e um link secundário. */
export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-stone-400" aria-hidden="true">
      <span className="h-px flex-1 bg-stone-200" />
      ou
      <span className="h-px flex-1 bg-stone-200" />
    </div>
  );
}
