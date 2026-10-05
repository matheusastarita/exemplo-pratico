import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { friendlyErrorMessage } from "@/lib/constants";
import { ErrorState } from "@/components/ui/EmptyState";
import { TeamManager } from "./TeamManager";

export const metadata: Metadata = { title: "Equipe" };

export default async function EquipePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_team");
  if (error || !data) return <ErrorState message={friendlyErrorMessage(error)} />;
  return <TeamManager initial={data} />;
}
