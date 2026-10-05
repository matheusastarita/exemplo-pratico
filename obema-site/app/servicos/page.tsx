import type { Metadata } from "next";
import { ArrowUpRight, CalendarCheck, ChartColumn, Check, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CtaSection } from "@/components/site/cta-section";
import { FaqSection } from "@/components/site/faq-section";
import { MethodSteps } from "@/components/site/method-steps";
import { PageHero } from "@/components/site/page-hero";
import { RemoteImage } from "@/components/site/remote-image";
import { SectionHeading } from "@/components/site/section-heading";
import { faq, services } from "@/lib/content";
import { diagnosticMessage, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Serviços",
  description:
    "Gestão de Instagram, captação e edição de vídeo, Google Meu Negócio, landing pages, identidade visual, estratégia de conteúdo e relatórios mensais. Oito frentes, um time só.",
  alternates: { canonical: "/servicos" },
};

const included = [
  { icon: CalendarCheck, title: "Acompanhamento semanal", text: "O que foi publicado, o que vem e o que os números dizem." },
  { icon: ChartColumn, title: "Relatório todo mês", text: "O plano do mês seguinte sai do relatório do anterior." },
  { icon: ShieldCheck, title: "30 dias de garantia", text: "Se no primeiro mês não fizer sentido, encerra sem multa." },
];

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Serviços"
        title={
          <>
            Oito frentes. <span className="text-slate-accent">Um time só.</span>
          </>
        }
        lede="Da câmera ligada ao relatório fechado, sem repassar seu problema pra cinco fornecedores. Contrate o que precisa agora e amplie quando fizer sentido."
        aside={
          <RemoteImage
            src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="hidden aspect-[4/5] rounded-xl lg:block"
          />
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={whatsappLink(diagnosticMessage)} target="_blank" rel="noopener noreferrer">
              Pedir um diagnóstico
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#como-funciona">Como funciona</a>
          </Button>
        </div>
      </PageHero>

      {/* Sempre incluído */}
      <section aria-labelledby="incluido-title" className="border-b border-border bg-muted">
        <div className="wrap grid gap-8 py-12 md:grid-cols-[auto_1fr] md:items-center md:gap-16">
          <h2 id="incluido-title" className="eyebrow">
            Sempre incluído
          </h2>
          <ul className="grid gap-6 sm:grid-cols-3">
            {included.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-white">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lista de serviços */}
      <section aria-label="Todos os serviços" className="py-16 md:py-24">
        <ol className="wrap">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <li
                key={service.slug}
                id={service.slug}
                data-reveal
                className="grid scroll-mt-28 gap-6 border-t border-border py-12 md:grid-cols-[5rem_1.1fr_1fr] md:gap-10 md:py-16"
              >
                <div className="flex items-center gap-4 md:flex-col md:items-start">
                  <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-navy text-white">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <div>
                  <h2 className="text-title font-extrabold tracking-[-0.03em]">{service.title}</h2>
                  <p className="mt-4 max-w-[48ch] text-lede text-muted-foreground">{service.description}</p>
                </div>
                <div className="flex flex-col justify-between gap-8">
                  <ul className="grid gap-3">
                    {service.includes.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-navy text-white">
                          <Check className="size-3" aria-hidden="true" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="self-start">
                    <a
                      href={whatsappLink(`Oi, quero saber mais sobre ${service.title} da OBEMA`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Quero {service.title.toLowerCase().startsWith("google") ? "o Google Meu Negócio" : "esse serviço"}
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Método */}
      <section id="como-funciona" className="scroll-mt-24 bg-muted py-24 md:py-32" aria-labelledby="como-title">
        <div className="wrap">
          <SectionHeading
            eyebrow="Como funciona"
            titleId="como-title"
            title="Do primeiro papo à agenda cheia."
            lede="Proposta clara, item por item. Sem pacote fechado que você não vai usar."
            align="split"
          />
          <div className="mt-14">
            <MethodSteps />
          </div>
        </div>
      </section>

      <FaqSection items={faq.slice(0, 4)} />
      <CtaSection className="pt-0 md:pt-0" />
    </>
  );
}
