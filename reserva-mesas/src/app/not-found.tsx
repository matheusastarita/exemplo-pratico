import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { RestaurantMark } from "@/components/RestaurantMark";
import { getPublicInfo } from "@/lib/restaurant";

export default async function NotFound() {
  const { info } = await getPublicInfo();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[rgb(var(--c-stone-50))] px-4 py-16 text-center">
      <RestaurantMark name={info.name} logoUrl={info.logo_url} size="md" />
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-ink">Página não encontrada</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
          O endereço pode ter mudado ou estar incompleto. Se recebeu um link de reserva, confira o código.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/reservar" className={buttonClasses("primary", "md")}>
          Reservar uma mesa
        </Link>
        <Link href="/r" className={buttonClasses("secondary", "md")}>
          Encontrar minha reserva
        </Link>
      </div>
    </main>
  );
}
