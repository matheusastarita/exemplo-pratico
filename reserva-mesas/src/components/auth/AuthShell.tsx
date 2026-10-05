import Link from "next/link";
import { RestaurantMark } from "@/components/RestaurantMark";
import { DemoNotice } from "@/components/DemoNotice";
import type { PublicInfo } from "@/lib/types";

/** Casca das telas de entrada (login/cadastro/recuperação de senha):
 *  painel na cor da marca no desktop, coluna única creme no celular. */
export function AuthShell({
  info,
  eyebrow,
  children,
}: {
  info: PublicInfo;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream lg:grid lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand px-14 py-14 text-brand-contrast lg:flex">
        <Link href="/" className="w-fit">
          <RestaurantMark name={info.name} logoUrl={info.logo_url} tone="light" size="md" />
        </Link>

        <div>
          <h1 className="max-w-md font-serif text-[42px] font-bold leading-[1.15]">
            Sua mesa,
            <br />
            sem espera.
          </h1>
          <div className="my-5 h-0.5 w-16 bg-white/60" />
          <p className="max-w-sm text-[15px] opacity-85">
            {info.tagline ?? "Reservas, salão e clientes em um só lugar."}
          </p>
        </div>

        {info.demo_mode ? (
          <p className="text-xs opacity-75">Ambiente de demonstração — restaurante fictício.</p>
        ) : (
          <span />
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-10 sm:px-6 lg:px-16">
        <Link href="/" className="mb-8 lg:hidden">
          <RestaurantMark name={info.name} logoUrl={info.logo_url} size="md" />
        </Link>

        <div className="w-full max-w-sm">
          {eyebrow && (
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
              {eyebrow}
            </p>
          )}
          {children}
        </div>

        {info.demo_mode && (
          <div className="mt-10 lg:hidden">
            <DemoNotice />
          </div>
        )}
      </div>
    </div>
  );
}
