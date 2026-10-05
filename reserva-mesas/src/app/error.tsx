"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";

/** Erro inesperado numa página: mensagem em português e caminho de volta (nunca "Error: ..."). */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Algo deu errado por aqui</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
          Não conseguimos carregar esta tela. Verifique a conexão e tente de novo; se continuar, volte ao início.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Tentar de novo</Button>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
