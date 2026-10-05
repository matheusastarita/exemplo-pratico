"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import GlyphPortal from "@/components/ui/glyph-portal";
import { Button } from "@/components/ui/button";
import { facts } from "@/lib/content";
import { diagnosticMessage, site, whatsappLink } from "@/lib/site";

const WORD = "OBEMA";

/** Mesmo smoothstep do GlyphPortal: 0 antes de `a`, 1 depois de `b`. */
const smooth = (a: number, b: number, n: number) => {
  const t = Math.min(1, Math.max(0, (n - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Abertura da home: a palavra OBEMA vira a porta do estúdio. Rolando, a
 * câmera entra pelo "O" azul-marinho e, do outro lado da letra, o fundo
 * clareia até o branco do topo da página.
 *
 * O GlyphPortal mede a tinta da fonte na montagem, então ele é remontado
 * (via `key`) assim que a Archivo termina de carregar. Até lá, a primeira
 * montagem fica no modo estático, que já mostra todo o conteúdo.
 */
export function HomePortal({ fontFamily }: { fontFamily: string }) {
  const primary = fontFamily.split(",")[0].trim();
  const [fontReady, setFontReady] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

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

  // Chamado a cada quadro de rolagem, direto no DOM (sem estado do React).
  const handleProgress = useCallback((progress: number) => {
    fieldRef.current?.style.setProperty("--to-white", String(smooth(0.58, 0.8, progress)));
  }, []);

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
        "--gp-paper": "#ffffff",
        "--gp-ink": "var(--navy)",
        "--gp-field": "#ffffff",
        "--gp-foreground": "var(--navy)",
      }}
      onProgress={handleProgress}
      background={<PortalField fieldRef={fieldRef} />}
      front={<PortalFront />}
    >
      <PortalContent />
    </GlyphPortal>
  );
}

/** Azul-marinho dentro das letras, que vira branco depois da travessia. */
function PortalField({ fieldRef }: { fieldRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={fieldRef}
      className="absolute inset-0"
      style={{
        transform: "scale(var(--gp-field-scale, 1))",
        background: "linear-gradient(150deg, #122849 0%, #0b1b34 55%, #071222 100%)",
      }}
    >
      <div className="absolute inset-0 bg-white" style={{ opacity: "var(--to-white, 0)" }} />
    </div>
  );
}

/** Composição da primeira tela, por cima da palavra. */
function PortalFront() {
  return (
    <>
      <p className="portal-eyebrow">
        <span className="font-display text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Estúdio de social media · {site.city.split(" ·")[0]}
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

const meta = [site.city, "Estúdio de social media", `Desde ${site.since}`];

/** Topo da home, revelado depois que a câmera atravessa a letra. */
function PortalContent() {
  return (
    <div className="wrap">
      <ul className="flex flex-wrap gap-x-7 gap-y-2 font-display text-[0.72rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {meta.map((item, i) => (
          <li key={item} className="flex items-center gap-2.5">
            <span aria-hidden="true" className={i === 0 ? "size-1.5 rounded-full bg-navy" : "size-1.5 rounded-full bg-slate-accent"} />
            {item}
          </li>
        ))}
      </ul>
      <h1 className="mt-10 font-display text-[clamp(2.75rem,0.7rem+7.7vw,9rem)] leading-[1.1] font-extrabold tracking-[-0.045em] text-navy">
        <span className="block">Presença digital</span>
        <span className="block">que vira</span>
        <span className="block text-slate-accent">agenda cheia.</span>
      </h1>
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <p className="max-w-[46ch] text-lede text-muted-foreground">
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
      <dl className="mt-16 grid grid-cols-3 border-t border-border">
        {facts.map((fact) => (
          <div key={fact.value} className="flex flex-col gap-1 pt-5 pr-4">
            <dt className="font-display text-lg font-bold tracking-tight sm:text-2xl">{fact.value}</dt>
            <dd className="text-xs text-muted-foreground sm:text-sm">{fact.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
