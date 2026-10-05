"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ClosureRow, RestaurantSettingsRow, ShiftRow, TurnTimeRow } from "@/lib/types";
import { BookingRulesForm } from "./BookingRulesForm";
import { ClosuresManager } from "./ClosuresManager";
import { ShiftsEditor } from "./ShiftsEditor";
import { TurnTimesEditor } from "./TurnTimesEditor";

export type RulesTab = "horarios" | "permanencia" | "regras" | "fechamentos";

const TABS: { key: RulesTab; label: string }[] = [
  { key: "horarios", label: "Horários" },
  { key: "permanencia", label: "Permanência" },
  { key: "regras", label: "Regras" },
  { key: "fechamentos", label: "Fechamentos" },
];

export function RulesTabs({
  initialTab,
  shifts,
  turnTimes,
  settings,
  closures,
  today,
}: {
  initialTab: RulesTab;
  shifts: ShiftRow[];
  turnTimes: TurnTimeRow[];
  settings: RestaurantSettingsRow;
  closures: ClosureRow[];
  today: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<RulesTab>(initialTab);

  function select(key: RulesTab) {
    setTab(key);
    // A aba vai na URL: dá para voltar direto nela (e compartilhar o link)
    router.replace(`/painel/gerencia/turnos?aba=${key}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Turnos e regras" subtitle="Quando o restaurante recebe reservas e como elas funcionam." />

      <div
        role="tablist"
        aria-label="Seções"
        className="-mx-4 -mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        onKeyDown={(e) => {
          // Setas trocam de aba (padrão de tablist)
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          const i = TABS.findIndex((t) => t.key === tab);
          const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
          select(next.key);
          document.getElementById(`tab-${next.key}`)?.focus();
        }}
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => select(t.key)}
              className={`min-h-tap shrink-0 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                active ? "bg-brand text-brand-contrast" : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "horarios" && <ShiftsEditor initialShifts={shifts} slotStep={settings.slot_step_minutes} />}
        {tab === "permanencia" && <TurnTimesEditor initial={turnTimes} />}
        {tab === "regras" && <BookingRulesForm initial={settings} />}
        {tab === "fechamentos" && <ClosuresManager initialClosures={closures} shifts={shifts} today={today} />}
      </div>
    </div>
  );
}
