import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { friendlyErrorMessage } from "@/lib/constants";
import { ErrorState } from "@/components/ui/EmptyState";
import type { AreaRow, DiningTableRow } from "@/lib/types";
import { TablesEditor } from "./TablesEditor";

export const metadata: Metadata = { title: "Salão e mesas" };

export default async function MesasPage() {
  const supabase = await createClient();
  const [areas, tables] = await Promise.all([
    supabase.from("areas").select("*").order("sort_order"),
    supabase.from("dining_tables").select("*"),
  ]);
  const error = areas.error ?? tables.error;
  if (error) return <ErrorState message={friendlyErrorMessage(error)} />;
  return <TablesEditor initialAreas={(areas.data ?? []) as AreaRow[]} initialTables={(tables.data ?? []) as DiningTableRow[]} />;
}
