import type { Metadata } from "next";
import { ArrowUpRight, AtSign, Clock, Mail, MapPin, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/site/contact-form";
import { CopyButton } from "@/components/site/copy-button";
import { FaqSection } from "@/components/site/faq-section";
import { PageHero } from "@/components/site/page-hero";
import { faq } from "@/lib/content";
import { diagnosticMessage, site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a OBEMA pelo WhatsApp, e-mail ou Instagram. Conversa de diagnóstico sem compromisso: a gente olha seu perfil e diz o que faria primeiro.",
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Vamos ver o que dá pra fazer com a sua marca?"
        lede="Conversa de diagnóstico, sem compromisso. Manda o @ da sua empresa: a gente responde com as duas ou três coisas que faria primeiro."
      />

      <section className="py-16 md:py-24" aria-label="Formas de contato">
        <div className="wrap grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-xl border border-border bg-card p-6 md:p-10">
            <h2 className="text-title font-bold tracking-[-0.03em]">Mande uma mensagem</h2>
            <p className="mt-3 mb-8 text-muted-foreground">Leva um minuto. Só o nome é obrigatório.</p>
            <ContactForm />
          </div>

          <aside className="dark flex flex-col gap-6 rounded-xl bg-background p-6 text-foreground md:p-10">
            <h2 className="text-title font-bold tracking-[-0.03em]">Prefere direto?</h2>
            <Button asChild size="lg" className="self-start">
              <a href={whatsappLink(diagnosticMessage)} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" />
                Abrir o WhatsApp
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
            <ul className="mt-2 grid">
              <ContactRow icon={MessageCircle} label="WhatsApp">
                <a className="hover:text-lime" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  {site.whatsapp.display}
                </a>
              </ContactRow>
              <ContactRow icon={Mail} label="E-mail">
                <span className="flex flex-wrap items-center gap-3">
                  <a className="hover:text-lime" href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                  <CopyButton value={site.email} />
                </span>
              </ContactRow>
              <ContactRow icon={AtSign} label="Instagram">
                <a className="hover:text-lime" href={site.instagram.url} target="_blank" rel="noopener noreferrer">
                  {site.instagram.handle}
                </a>
              </ContactRow>
              <ContactRow icon={MapPin} label="Base">
                {site.city}
              </ContactRow>
              <ContactRow icon={Clock} label="Resposta">
                Em horário comercial, geralmente no mesmo dia.
              </ContactRow>
            </ul>
          </aside>
        </div>
      </section>

      <FaqSection items={faq} className="pt-8 md:pt-12" />
    </>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 border-t border-border py-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-lime" aria-hidden />
      <div className="grid gap-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-medium">{children}</span>
      </div>
    </li>
  );
}
