import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CopyButton } from "@/components/site/copy-button";
import { Logo } from "@/components/site/logo";
import { nav, site, whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="dark relative overflow-hidden bg-background text-foreground">
      <div className="wrap pt-20 pb-8 md:pt-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <p className="eyebrow">Contato</p>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-block font-display text-display font-extrabold tracking-[-0.04em]"
            >
              Fala com a gente{" "}
              <span className="inline-flex items-center gap-3 text-slate-accent">
                no WhatsApp
                <ArrowUpRight
                  className="size-[0.7em] transition-transform duration-500 ease-brand group-hover:translate-x-1 group-hover:-translate-y-1"
                  aria-hidden="true"
                />
              </span>
            </a>
          </div>

          <dl className="grid content-start gap-0 text-sm">
            <FooterRow label="WhatsApp">
              <a className="underline-offset-4 hover:underline" href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                {site.whatsapp.display}
              </a>
            </FooterRow>
            <FooterRow label="E-mail">
              <span className="flex flex-wrap items-center gap-3">
                <a className="underline-offset-4 hover:underline" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
                <CopyButton value={site.email} />
              </span>
            </FooterRow>
            <FooterRow label="Instagram">
              <a className="underline-offset-4 hover:underline" href={site.instagram.url} target="_blank" rel="noopener noreferrer">
                {site.instagram.handle}
              </a>
            </FooterRow>
            <FooterRow label="Base">{site.city}</FooterRow>
          </dl>
        </div>

        <nav aria-label="Rodapé" className="mt-16">
          <ul className="flex flex-wrap gap-x-2 gap-y-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p
          aria-hidden="true"
          className="mt-6 select-none font-display text-[clamp(5rem,22vw,21rem)] leading-[0.8] font-black tracking-[-0.06em] text-foreground/[0.05]"
        >
          OBEMA
        </p>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-3">
            <Logo className="text-sm text-foreground" />© {new Date().getFullYear()} {site.name}
          </span>
          <span>Resultado medido, não prometido.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}
