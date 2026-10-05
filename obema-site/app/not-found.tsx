import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="dark relative isolate grid min-h-svh place-items-center overflow-hidden bg-background text-foreground">
      <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000,transparent_75%)]" />
      <div className="wrap py-40 text-center">
        <p className="eyebrow justify-center">Erro 404</p>
        <h1 className="mx-auto mt-6 max-w-[14ch] text-display font-bold tracking-[-0.035em]">
          Essa página não está no feed.
        </h1>
        <p className="mx-auto mt-6 max-w-[40ch] text-lede text-muted-foreground">
          O endereço pode ter mudado. Volte pro início ou fale com a gente.
        </p>
        <Button asChild size="lg" className="mt-10">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </section>
  );
}
