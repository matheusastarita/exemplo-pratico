import type { Metadata } from "next";
import { todayISODate } from "@/lib/dates";
import { ReportsView } from "./ReportsView";

export const metadata: Metadata = { title: "Relatórios" };

export default function RelatoriosPage() {
  return <ReportsView today={todayISODate()} />;
}
