import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ErrorState } from "@/components/ui/EmptyState";
import { SalaoView } from "@/components/salao/SalaoView";
import { todayISODate } from "@/lib/dates";

export const metadata: Metadata = { title: "Salão" };

/** Painel do anfitrião: linha do tempo, mapa de mesas, walk-in e fila — em tempo real. */
export default async function SalaoPage() {
  const supabase = await createClient();
  const today = todayISODate();
  const { data, error } = await supabase.rpc("host_day", { p_date: today });

  if (error || !data) {
    return <ErrorState message="Não foi possível carregar o salão. Verifique a conexão e recarregue a página." />;
  }
  return <SalaoView initial={data} today={today} />;
}
