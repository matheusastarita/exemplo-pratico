import type { Metadata } from "next";

import { CaseCompare } from "@/components/site/case-compare";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { SectionHeading } from "@/components/site/section-heading";
import { TestimonialVideos } from "@/components/site/testimonial-videos";
import { jmCase } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cases",
  description:
    "Case Instituto J. Mortensen: do perfil zerado ao perfil que apresenta o negócio. E os depoimentos em vídeo de clientes da OBEMA em Curitiba.",
  alternates: { canonical: "/cases" },
};

export default function CasesPage() {
  return (
    <>
      <PageHero
        eyebrow="Cases"
        title="Do perfil zerado ao perfil que apresenta o negócio."
        lede="Resultado medido, não prometido. Aqui está o antes e o depois de um trabalho real, e o que os clientes contam na frente da câmera."
      />

      <section className="py-24 md:py-32" aria-labelledby="case-title">
        <div className="wrap">
          <SectionHeading
            eyebrow={`Case · ${jmCase.segment}`}
            titleId="case-title"
            title={jmCase.name}
            lede={jmCase.lede}
            align="split"
          />
          <div className="mt-16">
            <CaseCompare />
          </div>
        </div>
      </section>

      <section className="bg-paper-2/60 py-24 md:py-32" aria-labelledby="entregas-title">
        <div className="wrap">
          <SectionHeading eyebrow="O que a gente criou" titleId="entregas-title" title="Quatro peças, um sistema só." />
          <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {jmCase.deliverables.map((item, i) => (
              <li key={item.title} data-reveal className="flex flex-col rounded-xl border border-border bg-card p-6">
                <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-10 text-xl font-bold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="dark bg-background py-24 text-foreground md:py-32" aria-labelledby="depoimentos-title">
        <div className="wrap">
          <figure className="max-w-5xl">
            <blockquote className="font-display text-display font-bold tracking-[-0.035em]">
              <span className="text-lime">“</span>
              {jmCase.quote}
              <span className="text-lime">”</span>
            </blockquote>
            <figcaption className="mt-6 text-sm text-muted-foreground">
              Case desenvolvido pela OBEMA · perfil{" "}
              <a href={jmCase.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
                {jmCase.handle}
              </a>
            </figcaption>
          </figure>

          <div className="mt-24 border-t border-border pt-16">
            <SectionHeading
              eyebrow="Depoimentos"
              titleId="depoimentos-title"
              title="Os clientes contam, na frente da câmera."
              lede="O que mudou no negócio depois que a conta começou a trabalhar."
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
        </div>
      </section>

      <CtaSection />
    </>
  );
}
