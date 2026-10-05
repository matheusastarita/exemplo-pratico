import Link from "next/link";
import type { PublicInfo } from "@/lib/types";

export function PublicFooter({ info }: { info: PublicInfo }) {
  return (
    <footer className="mt-14 border-t border-stone-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {info.today.slice(0, 4)} {info.name}
          {info.demo_mode && (
            <span className="block sm:inline">
              <span className="hidden sm:inline"> · </span>Ambiente de demonstração — restaurante fictício
            </span>
          )}
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-1" aria-label="Rodapé">
          <Link href="/r" className="inline-block min-h-tap py-3 hover:text-stone-800">
            Gerenciar minha reserva
          </Link>
          <Link href="/privacidade" className="inline-block min-h-tap py-3 hover:text-stone-800">
            Privacidade
          </Link>
          <Link href="/termos" className="inline-block min-h-tap py-3 hover:text-stone-800">
            Termos
          </Link>
          <Link href="/painel/entrar" className="inline-block min-h-tap py-3 hover:text-stone-800">
            Área do restaurante
          </Link>
        </nav>
      </div>
    </footer>
  );
}
