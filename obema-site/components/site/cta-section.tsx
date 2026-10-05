import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { testimonials } from "@/lib/content";
import { diagnosticMessage, whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";

export function CtaSection({ className }: { className?: string }) {
  return (
    <section className={cn("py-16 md:py-24", className)} aria-labelledby="cta-title">
      <div className="wrap">
        <div className="dark relative isolate overflow-hidden rounded-[clamp(24px,3vw,40px)] bg-background p-8 text-foreground md:p-14 lg:p-20">
          <div
            aria-hidden="true"
            className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_80%_at_85%_10%,#000,transparent_75%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-32 -bottom-40 -z-10 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(201,240,60,0.2),transparent)]"
          />
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className="eyebrow">Próximo passo</p>
              <h2 id="cta-title" className="mt-5 max-w-[16ch] text-display font-bold tracking-[-0.035em]">
                Vamos ver o que dá pra fazer com a sua marca?
              </h2>
              <p className="mt-6 max-w-[46ch] text-lede text-muted-foreground">
                Conversa de diagnóstico, sem compromisso. A gente olha seu perfil e diz o que faria primeiro.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href={whatsappLink(diagnosticMessage)} target="_blank" rel="noopener noreferrer">
                    Falar no WhatsApp
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/contato">Mandar uma mensagem</Link>
                </Button>
              </div>
            </div>

            <aside className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm md:p-8">
              <p className="font-display text-xl font-bold">Manda o @ da sua empresa.</p>
              <p className="mt-3 text-sm text-muted-foreground">
                A gente responde com as duas ou três coisas que faria primeiro. Em horário comercial, geralmente no mesmo dia.
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex -space-x-3" aria-hidden="true">
                  {testimonials.map((person) => (
                    <span key={person.name} className="relative size-11 overflow-hidden rounded-full border-2 border-navy-2">
                      <Image src={person.poster} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Valdir, Rodolfo e Edson já contaram como foi.</span>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
