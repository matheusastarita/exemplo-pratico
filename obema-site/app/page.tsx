import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CaseHighlight } from "@/components/site/case-highlight";
import { CtaSection } from "@/components/site/cta-section";
import { FaqSection } from "@/components/site/faq-section";
import { HomePortal } from "@/components/site/home-portal";
import { Marquee } from "@/components/site/marquee";
import { MethodSteps } from "@/components/site/method-steps";
import { SectionHeading } from "@/components/site/section-heading";
import { ServicesGrid } from "@/components/site/services-grid";
import { TestimonialVideos } from "@/components/site/testimonial-videos";
import { principles } from "@/lib/content";
import { archivo } from "@/lib/fonts";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <HomePortal fontFamily={archivo.style.fontFamily} />
      <Marquee />

      {/* Sobre */}
      <section className="py-24 md:py-32" aria-labelledby="sobre-title">
        <div className="wrap">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-20">
            <div>
              <p className="eyebrow">Sobre a OBEMA</p>
              <h2 id="sobre-title" className="mt-5 text-display font-extrabold tracking-[-0.04em]">
                Empresa boa merece presença à altura.
              </h2>
            </div>
            <p className="font-display text-[clamp(1.25rem,0.95rem+1.1vw,2rem)] leading-snug font-medium tracking-tight text-muted-foreground">
              A OBEMA nasceu em Curitiba pra resolver um problema comum: negócios sólidos, com bom atendimento e boa
              reputação, <span className="text-foreground">quase invisíveis nas redes.</span> A gente cuida dessa parte.
            </p>
          </div>
          <ul className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} data-reveal className="border-t border-navy pt-6">
                  <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="mt-6 text-lg font-bold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="bg-muted py-24 md:py-32" aria-labelledby="servicos-title">
        <div className="wrap">
          <SectionHeading
            eyebrow="Serviços"
            titleId="servicos-title"
            title={
              <>
                Oito frentes.
                <br />
                Um time só.
              </>
            }
            lede="Da câmera ligada ao relatório fechado, sem repassar seu problema pra cinco fornecedores. Acompanhamento semanal e relatório mensal sempre incluídos."
            align="split"
          />
          <div className="mt-14">
            <ServicesGrid />
          </div>
        </div>
      </section>

      {/* Método */}
      <section id="metodo" className="py-24 md:py-32" aria-labelledby="metodo-title">
        <div className="wrap">
          <SectionHeading
            eyebrow="Método"
            titleId="metodo-title"
            title="Do primeiro papo à agenda cheia."
            lede="Quatro passos, sem mistério. Você sabe o que está acontecendo em cada semana."
            align="split"
          />
          <div className="mt-14">
            <MethodSteps />
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/contato">
                Marcar a conversa de diagnóstico
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">15 a 20 minutos, sem compromisso.</span>
          </div>
        </div>
      </section>

      <CaseHighlight />

      {/* Depoimentos */}
      <section
        id="depoimentos"
        className="dark border-t border-border bg-background py-24 text-foreground md:py-32"
        aria-labelledby="depoimentos-title"
      >
        <div className="wrap">
          <SectionHeading
            eyebrow="Depoimentos"
            titleId="depoimentos-title"
            title="Os clientes contam, na frente da câmera."
            lede="Sem carrossel de print. O que importa é o que mudou no negócio depois que a conta começou a trabalhar."
            align="split"
          />
          <TestimonialVideos className="mt-14" />
          <p className="mt-8 text-sm text-muted-foreground">
            Do destaque de feedbacks ·{" "}
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
              {site.instagram.handle}
            </a>
          </p>
        </div>
      </section>

      <FaqSection />
      <CtaSection className="pt-0 md:pt-0" />
    </>
  );
}
