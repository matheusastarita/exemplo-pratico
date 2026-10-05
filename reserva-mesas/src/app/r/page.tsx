import type { Metadata } from "next";
import Link from "next/link";
import { RestaurantMark } from "@/components/RestaurantMark";
import { PublicFooter } from "@/components/PublicFooter";
import { Card } from "@/components/ui/Card";
import { getPublicInfo } from "@/lib/restaurant";
import { FindReservation } from "./FindReservation";

export const metadata: Metadata = { title: "Gerenciar reserva" };

export default async function FindReservationPage() {
  const { info } = await getPublicInfo();
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label={`Voltar para ${info.name}`}>
            <RestaurantMark name={info.name} logoUrl={info.logo_url} size="sm" />
          </Link>
        </div>
      </header>
      <main className="px-4 pt-6">
        <Card className="mx-auto max-w-xl">
          <h1 className="font-serif text-2xl font-bold text-stone-900">Gerenciar minha reserva</h1>
          <p className="mt-1 text-sm text-stone-600">
            Digite o código que você recebeu na confirmação e o celular usado na reserva.
          </p>
          <FindReservation />
          <p className="mt-5 text-center text-sm text-stone-500">
            Tem conta?{" "}
            <Link href="/minhas-reservas" className="font-medium text-brand-ink hover:underline">
              Veja todas as suas reservas
            </Link>
          </p>
        </Card>
      </main>
      <PublicFooter info={info} />
    </div>
  );
}
