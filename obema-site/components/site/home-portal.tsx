"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import GlyphPortal from "@/components/ui/glyph-portal";
import { Button } from "@/components/ui/button";
import { facts } from "@/lib/content";
import { diagnosticMessage, site, whatsappLink } from "@/lib/site";

const WORD = "OBEMA";

/**
 * Abertura da home: a palavra OBEMA vira a porta do estúdio. Rolando, a
 * câmera entra pelo "O" e o azul-marinho de dentro das letras vira o fundo
 * do texto principal.
 *
 * O GlyphPortal mede a tinta da fonte na montagem, então ele é remontado
 * (via `key`) assim que a Archivo termina de carregar. Até lá, a primeira
 * montagem fica no modo estático, que já mostra todo o conteúdo.
 */
export function HomePortal({ fontFamily }: { fontFamily: string }) {
  const primary = fontFamily.split(",")[0].trim();
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setFontReady(true);
    };
    const timer = window.setTimeout(done, 2000);
    document.fonts.load(`900 100px ${primary}`, WORD).then(done, done);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [primary]);

  return (
    <GlyphPortal
      key={fontReady ? "ready" : "pending"}
      word={WORD}
      focusChar="O"
      interactive={false}
      fontFamily={`${primary}, Arial, sans-serif`}
      fontWeight={900}
      scrollLength={2.2}
      enterLabel="Entrar no estúdio"
      className="home-portal"
      style={{
        "--gp-paper": "var(--paper)",
        "--gp-ink": "var(--navy)",
        "--gp-field": "var(--navy)",
        "--gp-foreground": "#eef2f7",
      }}
      background={<PortalField />}
      front={<PortalFront />}
    >
      <PortalContent />
    </GlyphPortal>
  );
}

/** O que aparece dentro das letras e, depois, atrás do texto principal. */
function PortalField() {
  return (
    <div
      className="absolute inset-0"
      style={{
        transform: "scale(var(--gp-field-scale, 1))",
        background:
          "radial-gradient(circle at 20% 22%, rgba(201,240,60,.34), transparent 30%), radial-gradient(circle at 78% 28%, rgba(43,75,122,.95), transparent 42%), radial-gradient(circle at 55% 100%, rgba(201,240,60,.14), transparent 42%), linear-gradient(140deg, #0b1b34 0%, #122849 55%, #071222 100%)",
      }}
    >
      <div className="bg-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_80%_70%_at_70%_30%,#000,transparent_80%)]" />
    </div>
  );
}

/** Composição da primeira tela, por cima da palavra. */
function PortalFront() {
  return (
    <>
      <p className="portal-eyebrow">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-navy/15 bg-card/70 px-4 py-2 backdrop-blur-sm">
          <span className="ping-dot size-2 rounded-full bg-lime ring-1 ring-navy/20" aria-hidden="true" />
          Estúdio de social media · {site.city.split(" ·")[0]} · desde {site.since}
        </span>
      </p>
      <p className="portal-support">Gestão de Instagram, vídeo e estratégia num time só.</p>
      <span className="portal-scroll" aria-hidden="true">
        Role para entrar
        <ArrowDown className="size-3.5" />
      </span>
    </>
  );
}

/** Texto principal, revelado depois que a câmera atravessa a letra. */
function PortalContent() {
  return (
    <div className="dark wrap">
      <p className="inline-flex items-center gap-2.5 rounded-full border border-lime/40 bg-lime/[0.06] px-4 py-2 font-display text-xs font-semibold tracking-[0.12em] text-lime uppercase">
        <span className="size-2 rounded-full bg-lime" aria-hidden="true" />
        OBEMA Marketing · {site.city}
      </p>
      <h1 className="mt-7 max-w-[13ch] text-hero font-bold tracking-[-0.045em] text-foreground">
        Presença digital que vira <span className="text-lime">agenda cheia.</span>
      </h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <p className="max-w-[44ch] text-lede text-muted-foreground">
          Gestão de Instagram, vídeo e estratégia num time só. Acompanhamento semanal e relatório de resultado todo mês.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={whatsappLink(diagnosticMessage)} target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/servicos">Ver serviços</Link>
          </Button>
        </div>
      </div>
      <dl className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border md:mt-14">
        {facts.map((fact) => (
          <div key={fact.value} className="flex flex-col gap-1 bg-navy/85 p-3.5 backdrop-blur-sm sm:p-5 md:p-6">
            <dt className="font-display text-lg font-bold tracking-tight text-foreground sm:text-2xl">{fact.value}</dt>
            <dd className="text-xs text-muted-foreground sm:text-sm">{fact.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
