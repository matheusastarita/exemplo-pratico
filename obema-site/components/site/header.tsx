"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import { nav, site, whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));
  const { tone, scrolled } = useHeaderState(pathname);

  return (
    <header
      data-tone={tone}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-transparent text-foreground transition-[background-color,border-color,color] duration-300",
        tone === "dark" && "dark",
        scrolled && "border-border bg-background/90 backdrop-blur-md"
      )}
    >
      <div className="wrap flex h-[76px] items-center justify-between gap-6">
        <Link href="/" aria-label="OBEMA Marketing, página inicial" className="flex min-h-11 items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-6">
          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="group relative inline-flex min-h-11 items-center px-3 text-sm text-foreground/65 transition-colors hover:text-foreground aria-[current=page]:text-foreground"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 bottom-2 h-px origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100 group-aria-[current=page]:scale-x-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Button asChild variant="outline" size="sm" className="hidden h-10 border-foreground/70 px-5 hover:border-foreground sm:inline-flex">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              WhatsApp
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 lg:hidden" aria-label="Abrir menu">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" closeLabel="Fechar menu" className="w-full border-border sm:max-w-md">
              <SheetHeader className="px-6 pt-6">
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
                <SheetDescription className="text-left">Estúdio de social media · {site.city}</SheetDescription>
              </SheetHeader>
              <nav aria-label="Menu" className="px-6">
                <ul className="flex flex-col">
                  {nav.map((item) => (
                    <li key={item.href} className="border-b border-border">
                      <SheetClose asChild>
                        <Link
                          href={item.href}
                          aria-current={isActive(item.href) ? "page" : undefined}
                          className="flex min-h-16 items-center font-display text-3xl font-bold tracking-tight text-foreground/55 transition-colors hover:text-foreground aria-[current=page]:text-foreground"
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto flex flex-col gap-3 p-6">
                <Button asChild size="lg">
                  <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                    Falar no WhatsApp
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
                <a
                  href={site.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center text-sm text-muted-foreground hover:text-foreground"
                >
                  {site.instagram.handle} no Instagram
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

/**
 * Olha o que está logo abaixo do cabeçalho:
 * - `tone` vira "dark" sobre seções azul-marinho de largura total
 *   (section/footer com .dark) e enquanto a câmera do portal da home está
 *   dentro do azul da letra;
 * - `scrolled` liga o fundo do cabeçalho assim que a página sai do topo.
 */
function useHeaderState(pathname: string) {
  const [state, setState] = useState<{ tone: "light" | "dark"; scrolled: boolean }>({
    tone: "light",
    scrolled: false,
  });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const below = document
        .elementsFromPoint(window.innerWidth / 2, 38)
        .find((element) => !element.closest("header"));
      const portal = below?.closest<HTMLElement>(".home-portal");
      let tone: "light" | "dark" = "light";
      if (portal) {
        const progress = Number(portal.dataset.gpProgress ?? 0);
        tone = progress > 0.42 && progress < 0.7 ? "dark" : "light";
      } else if (below?.closest("section.dark, footer.dark")) {
        tone = "dark";
      }
      const scrolled = window.scrollY > 8;
      setState((current) =>
        current.tone === tone && current.scrolled === scrolled ? current : { tone, scrolled }
      );
    };
    // Dois quadros: o portal atualiza o próprio progresso no quadro da
    // rolagem, então o cabeçalho lê depois dele.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => (frame = requestAnimationFrame(update)));
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  return state;
}
