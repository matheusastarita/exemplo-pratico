import Link from "next/link";
import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buttonClasses } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlusIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { firstName } from "@/lib/format";
import { getSession } from "@/lib/session";
import { ReservationList } from "./ReservationList";

export const metadata: Metadata = { title: "Minhas reservas" };

export default async function MinhasReservasPage() {
  const supabase = await createClient();
  const [{ profile }, { data, error }] = await Promise.all([getSession(), supabase.rpc("my_reservations")]);
  const name = firstName(profile?.full_name);

  return (
    <div>
      <SectionHeader
        serif
        title={name ? `Olá, ${name}!` : "Minhas reservas"}
        subtitle="Suas reservas, histórico e atalhos para reservar de novo."
        action={
          <Link href="/reservar" className={buttonClasses("primary", "md")}>
            <PlusIcon size={16} /> Nova reserva
          </Link>
        }
      />
      {error ? (
        <ErrorState message="Não foi possível carregar suas reservas. Tente novamente em instantes." />
      ) : (
        <ReservationList reservations={data ?? []} />
      )}
    </div>
  );
}
