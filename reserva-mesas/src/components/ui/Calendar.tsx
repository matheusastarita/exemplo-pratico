import { ChevronIcon } from "@/components/icons";
import { dayOfMonth, firstOfMonth, monthGridDays, monthTitle } from "@/lib/dates";

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

/** Calendário mensal. Só desenha e avisa cliques — quem manda nas datas é o pai. */
export function Calendar({
  month,
  selected,
  today,
  minDate,
  maxDate,
  closed,
  full,
  marked,
  onSelect,
  onMonthChange,
  legend = true,
}: {
  /** Qualquer data do mês exibido. */
  month: string;
  selected: string | null;
  today: string;
  /** Fora de [minDate, maxDate] não dá pra selecionar. */
  minDate: string;
  maxDate: string;
  /** Dias fechados (riscados e desabilitados). */
  closed?: (date: string) => boolean;
  /** Dias lotados (selecionáveis — levam à lista de espera). */
  full?: Set<string>;
  /** Dias com marcação (ex.: com reservas no painel). */
  marked?: Set<string>;
  onSelect: (date: string) => void;
  onMonthChange: (delta: number) => void;
  legend?: boolean;
}) {
  const days = monthGridDays(month);
  const shownMonth = month.slice(0, 7);
  const canPrev = firstOfMonth(month) > firstOfMonth(minDate);
  const canNext = firstOfMonth(month) < firstOfMonth(maxDate);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(-1)}
          disabled={!canPrev}
          aria-label="Mês anterior"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30"
        >
          <ChevronIcon direction="left" size={16} />
        </button>
        <p className="text-sm font-semibold text-stone-800" aria-live="polite">
          {monthTitle(month)}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(1)}
          disabled={!canNext}
          aria-label="Próximo mês"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30"
        >
          <ChevronIcon direction="right" size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-2 text-[10px] font-medium tracking-wide text-stone-500">
            {w}
          </span>
        ))}

        {days.map((date) => {
          const inMonth = date.startsWith(shownMonth);
          const isSelected = date === selected;
          const isToday = date === today;
          const outOfRange = date < minDate || date > maxDate;
          const isClosed = !outOfRange && (closed?.(date) ?? false);
          const isFull = !outOfRange && !isClosed && (full?.has(date) ?? false);
          const isMarked = marked?.has(date) ?? false;
          const disabled = outOfRange || isClosed;

          const tone = isSelected
            ? "bg-brand font-semibold text-brand-contrast"
            : disabled
              ? `text-stone-300 ${isClosed ? "line-through" : ""}`
              : isToday
                ? "font-semibold text-brand-ink ring-1 ring-brand/70"
                : inMonth
                  ? "text-stone-800 hover:bg-stone-100"
                  : "text-stone-400 hover:bg-stone-100";

          return (
            <div key={date} className="flex flex-col items-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(date)}
                aria-label={`${dayOfMonth(date)} de ${monthTitle(date)}${isClosed ? ", fechado" : ""}${
                  isFull ? ", lotado" : ""
                }${isMarked ? ", com reservas" : ""}`}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors disabled:cursor-not-allowed ${tone}`}
              >
                {dayOfMonth(date)}
              </button>
              <span className="mt-0.5 flex h-1.5 gap-0.5" aria-hidden="true">
                {isFull && <span className="h-1 w-1 rounded-full bg-status-no-show" />}
                {isMarked && <span className="h-1 w-1 rounded-full bg-brand" />}
              </span>
            </div>
          );
        })}
      </div>

      {legend && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full ring-1 ring-brand" /> Hoje
          </span>
          {full && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-status-no-show" /> Lotado
            </span>
          )}
          {marked && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand" /> Com reservas
            </span>
          )}
          {closed && <span className="line-through">Fechado</span>}
        </div>
      )}
    </div>
  );
}
