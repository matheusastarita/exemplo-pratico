import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPublicInfo } from "@/lib/restaurant";
import { todayISODate } from "@/lib/dates";
import type { AreaRow } from "@/lib/types";
import { ReservationsTable } from "./ReservationsTable";

export const metadata: Metadata = { title: "Reservas" };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function ReservasPage({ searchParams }: PageProps<"/painel/gerencia/reservas">) {
  // ?de=AAAA-MM-DD&ate=AAAA-MM-DD abre direto num período (ex.: link de um dia fechado)
  const { de, ate } = await searchParams;
  const initialRange =
    typeof de === "string" && ISO_DATE.test(de) && typeof ate === "string" && ISO_DATE.test(ate) && de <= ate
      ? ([de, ate] as [string, string])
      : undefined;
  const supabase = await createClient();
  const [{ data: areas }, { info }] = await Promise.all([
    supabase.from("areas").select("*").eq("active", true).order("sort_order"),
    getPublicInfo(),
  ]);
  return (
    <ReservationsTable
      today={todayISODate()}
      areas={(areas as AreaRow[] | null) ?? []}
      restaurant={info.name}
      initialRange={initialRange}
    />
  );
}
