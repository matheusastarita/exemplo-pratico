import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPublicInfo } from "@/lib/restaurant";
import { todayISODate } from "@/lib/dates";
import type { AreaRow } from "@/lib/types";
import { ReservationsTable } from "./ReservationsTable";

export const metadata: Metadata = { title: "Reservas" };

export default async function ReservasPage() {
  const supabase = await createClient();
  const [{ data: areas }, { info }] = await Promise.all([
    supabase.from("areas").select("*").eq("active", true).order("sort_order"),
    getPublicInfo(),
  ]);
  return <ReservationsTable today={todayISODate()} areas={(areas as AreaRow[] | null) ?? []} restaurant={info.name} />;
}
