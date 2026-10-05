import Link from "next/link";
import { RestaurantMark } from "@/components/RestaurantMark";
import { PublicFooter } from "@/components/PublicFooter";
import { ArrowLeftIcon } from "@/components/icons";
import type { PublicInfo } from "@/lib/types";

/** Casca das páginas institucionais (privacidade, termos). */
export function LegalPage({
  info,
  title,
  updated,
  children,
}: {
  info: PublicInfo;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label={`Voltar para ${info.name}`}>
            <RestaurantMark name={info.name} logoUrl={info.logo_url} size="sm" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="inline-flex min-h-tap items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900">
          <ArrowLeftIcon size={16} /> Voltar
        </Link>
        <h1 className="mt-2 font-serif text-[32px] font-bold leading-tight text-stone-900">{title}</h1>
        <p className="mt-1 text-sm text-stone-500">Atualizado em {updated}</p>
        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-stone-700 [&_h2]:mb-1.5 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-stone-900 [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
      <PublicFooter info={info} />
    </div>
  );
}
