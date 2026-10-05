import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { todayISODate } from "@/lib/dates";
import { friendlyErrorMessage } from "@/lib/constants";
import { ErrorState } from "@/components/ui/EmptyState";
import { CustomersList } from "./CustomersList";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("customer_list");
  if (error) return <ErrorState message={friendlyErrorMessage(error)} />;
  return <CustomersList customers={data ?? []} today={todayISODate()} />;
}
