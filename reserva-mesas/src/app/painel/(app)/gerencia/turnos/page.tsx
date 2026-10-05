import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { todayISODate } from "@/lib/dates";
import { friendlyErrorMessage } from "@/lib/constants";
import { ErrorState } from "@/components/ui/EmptyState";
import type { ClosureRow, RestaurantSettingsRow, ShiftRow, TurnTimeRow } from "@/lib/types";
import { RulesTabs, type RulesTab } from "./RulesTabs";

export const metadata: Metadata = { title: "Turnos e regras" };

const TABS: RulesTab[] = ["horarios", "permanencia", "regras", "fechamentos"];

export default async function TurnosPage({ searchParams }: PageProps<"/painel/gerencia/turnos">) {
  const { aba } = await searchParams;
  const initialTab = TABS.find((t) => t === aba) ?? "horarios";
  const today = todayISODate();

  // Sempre do banco, a cada visita: as telas de turno nunca mostram dado velho
  const supabase = await createClient();
  const [shifts, turnTimes, settings, closures] = await Promise.all([
    supabase.from("shifts").select("*"),
    supabase.from("turn_times").select("*").order("party_min"),
    supabase.from("restaurant_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("closures").select("*").gte("date", today).order("date"),
  ]);
  const error = shifts.error ?? turnTimes.error ?? settings.error ?? closures.error;
  if (error || !settings.data) return <ErrorState message={friendlyErrorMessage(error)} />;

  return (
    <RulesTabs
      initialTab={initialTab}
      shifts={(shifts.data ?? []) as ShiftRow[]}
      turnTimes={(turnTimes.data ?? []) as TurnTimeRow[]}
      settings={settings.data as RestaurantSettingsRow}
      closures={(closures.data ?? []) as ClosureRow[]}
      today={today}
    />
  );
}
