import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ErrorState } from "@/components/ui/EmptyState";
import { OverviewView } from "./OverviewView";

export const metadata: Metadata = { title: "Visão geral" };

export default async function GerenciaPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("manager_overview");
  if (error || !data) {
    return <ErrorState message="Não foi possível carregar a visão geral. Recarregue a página." />;
  }
  return <OverviewView data={data} />;
}
