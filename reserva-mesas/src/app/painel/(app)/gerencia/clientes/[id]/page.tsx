import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicInfo } from "@/lib/restaurant";
import { todayISODate } from "@/lib/dates";
import { friendlyErrorMessage } from "@/lib/constants";
import { ErrorState } from "@/components/ui/EmptyState";
import { CustomerProfile } from "./CustomerProfile";

export const metadata: Metadata = { title: "Ficha do cliente" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CustomerPage({ params }: PageProps<"/painel/gerencia/clientes/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data, error }, { info }] = await Promise.all([
    supabase.rpc("customer_detail", { p_id: id }),
    getPublicInfo(),
  ]);
  if (error?.message.includes("not_found")) notFound();
  if (error || !data) return <ErrorState message={friendlyErrorMessage(error)} />;

  return <CustomerProfile detail={data} today={todayISODate()} restaurant={info.name} />;
}
