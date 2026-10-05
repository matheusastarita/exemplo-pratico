import type { ReservationStatus } from "@/lib/types";

// "late" não é status do banco: é a reserva confirmada que passou da tolerância e o
// grupo ainda não chegou (ver displayStatusOf em lib/agenda).
export type BadgeTone = ReservationStatus | "late" | "neutral" | "brand" | "warning";

const TONE_CLASSES: Record<BadgeTone, string> = {
  pending: "bg-status-pending-bg text-status-pending",
  confirmed: "bg-status-confirmed-bg text-status-confirmed",
  seated: "bg-status-seated-bg text-status-seated",
  completed: "bg-status-completed-bg text-status-completed",
  no_show: "bg-status-no-show-bg text-status-no-show",
  cancelled: "bg-status-cancelled-bg text-status-cancelled",
  late: "bg-status-late-bg text-status-late",
  neutral: "bg-stone-100 text-stone-700",
  brand: "bg-brand-soft text-brand-ink",
  warning: "bg-amber-50 text-amber-800",
};

export function Badge({
  tone,
  size = "sm",
  icon,
  children,
}: {
  tone: BadgeTone;
  size?: "sm" | "md";
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium ${
        size === "md" ? "px-3 py-1 text-[13px]" : "px-2.5 py-0.5 text-xs"
      } ${TONE_CLASSES[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
