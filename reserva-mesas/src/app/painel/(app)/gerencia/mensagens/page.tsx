import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPublicInfo } from "@/lib/restaurant";
import { friendlyErrorMessage } from "@/lib/constants";
import { isoDateAddDays, todayISODate, weekdayOf } from "@/lib/dates";
import { ErrorState } from "@/components/ui/EmptyState";
import type { MessageTemplateRow } from "@/lib/types";
import { MessagesView } from "./MessagesView";

export const metadata: Metadata = { title: "Mensagens" };

export default async function MensagensPage() {
  const supabase = await createClient();
  const [{ data, error }, settings, { info }] = await Promise.all([
    supabase.from("message_templates").select("*"),
    supabase.from("restaurant_settings").select("public_url").eq("id", 1).maybeSingle(),
    getPublicInfo(),
  ]);
  if (error) return <ErrorState message={friendlyErrorMessage(error)} />;

  // Dados de exemplo da prévia: a próxima sexta, 20h, mesa para 4
  const today = todayISODate();
  let friday = isoDateAddDays(today, 1);
  while (weekdayOf(friday) !== 5) friday = isoDateAddDays(friday, 1);
  const [, m, d] = friday.split("-");
  const base = settings.data?.public_url?.replace(/\/+$/, "") ?? "";
  const sample = {
    "{nome}": "Mariana",
    "{data}": `${d}/${m}`,
    "{hora}": "20:00",
    "{pessoas}": "4 pessoas",
    "{codigo}": "K7M2XQ9P",
    "{link}": `${base}/r/K7M2XQ9P`,
    "{restaurante}": info.name,
    "{endereco}": info.address ?? "",
  };

  return <MessagesView templates={(data ?? []) as MessageTemplateRow[]} sample={sample} restaurant={info.name} />;
}
