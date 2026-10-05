import type { Metadata } from "next";

import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { RemoteImage } from "@/components/site/remote-image";
import { SectionHeading } from "@/components/site/section-heading";
import { principles } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "A OBEMA nasceu em Curitiba pra dar presença digital à altura de negócios sólidos. Atendimento direto com os fundadores, acompanhamento semanal e transparência total.",
  alternates: { canonical: "/sobre" },
};

const numbers = [
  { value: site.city.split(" ·")[0], label: "onde a gente está" },
  { value: `Desde ${site.since}`, label: "cuidando de marcas locais" },
  { value: "8 frentes", label: "de serviço, num time só" },
  { value: "30 dias", label: "de garantia, sem multa" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre a OBEMA"
        title="Empresa boa merece presença à altura."
        lede="A OBEMA nasceu em Curitiba pra resolver um problema comum: negócios sólidos, com bom atendimento e boa reputação, quase invisíveis nas redes. A gente cuida dessa parte."
        aside={
          <RemoteImage
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="hidden aspect-[4/5] rounded-xl lg:block"
          />
        }
      />

      <section aria-label="A OBEMA em números" className="border-b border-border bg-card">
        <dl className="wrap grid grid-cols-2 gap-y-8 py-12 lg:grid-cols-4">
          {numbers.map((item) => (
            <div key={item.label} className="flex flex-col gap-1 border-l border-border pl-5">
              <dt className="font-display text-2xl font-bold tracking-tight md:text-3xl">{item.value}</dt>
              <dd className="text-sm text-muted-foreground">{item.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-24 md:py-32" aria-labelledby="principios-title">
        <div className="wrap">
          <SectionHeading
            eyebrow="Como a gente trabalha"
            titleId="principios-title"
            title="Quatro combinados que não mudam."
            lede="Contrate o que precisa agora e amplie quando fizer sentido. Isso aqui vem junto em qualquer formato."
            align="split"
          />
          <ul className="mt-14 grid gap-3 sm:grid-cols-2">
            {principles.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.title} data-reveal className="flex gap-6 rounded-xl border border-border bg-card p-6 md:p-8">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-lime">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-1 text-xl font-bold tracking-tight">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground">{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="dark bg-background py-24 text-foreground md:py-32" aria-labelledby="time-title">
        <div className="wrap grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Quem toca</p>
            <h2 id="time-title" className="mt-5 text-display font-bold tracking-[-0.035em]">
              Atendimento direto com quem decide.
            </h2>
            <p className="mt-6 max-w-[42ch] text-lede text-muted-foreground">
              Sem camada de gerente de contas entre você e quem produz.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {site.founders.map((person) => (
              <li key={person.name} data-reveal className="rounded-xl border border-border bg-card p-6 md:p-8">
                <span
                  aria-hidden="true"
                  className="grid size-16 place-items-center rounded-full border-[5px] border-lime font-display text-lg font-bold"
                >
                  {initials(person.name)}
                </span>
                <p className="mt-10 font-display text-2xl font-bold tracking-tight">{person.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{person.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
