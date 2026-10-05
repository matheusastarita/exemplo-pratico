import type { Metadata } from "next";
import Link from "next/link";
import { RestaurantMark } from "@/components/RestaurantMark";
import { PublicFooter } from "@/components/PublicFooter";
import { getPublicInfo } from "@/lib/restaurant";
import { ManageReservation } from "./ManageReservation";

export const metadata: Metadata = { title: "Minha reserva" };

/** Gerenciar reserva sem login: código + celular. */
export default async function ManageReservationPage({ params }: PageProps<"/r/[code]">) {
  const [{ info }, { code }] = await Promise.all([getPublicInfo(), params]);
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label={`Voltar para ${info.name}`}>
            <RestaurantMark name={info.name} logoUrl={info.logo_url} size="sm" />
          </Link>
          <Link href="/reservar" className="min-h-tap px-2 py-3 text-sm font-medium text-brand-ink hover:underline">
            Nova reserva
          </Link>
        </div>
      </header>
      <main className="px-4 pt-6">
        <ManageReservation info={info} code={normalized} />
      </main>
      <PublicFooter info={info} />
    </div>
  );
}
