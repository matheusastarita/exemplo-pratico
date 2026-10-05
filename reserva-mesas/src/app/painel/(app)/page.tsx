import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatDateHeading, todayISODate } from "@/lib/dates";

export default function SalaoPage() {
  return <SectionHeader title="Salão" subtitle={formatDateHeading(todayISODate())} />;
}
