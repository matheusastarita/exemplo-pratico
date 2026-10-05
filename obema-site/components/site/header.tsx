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
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const tone = useToneBelowHeader(pathname);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-3">
      <div className="wrap">
        <div
          data-tone={tone}
          className={cn(
            "flex h-16 items-center justify-between gap-4 rounded-full border border-border bg-background/95 pr-2 pl-5 text-foreground shadow-[0_8px_30px_-12px_rgba(7,18,34,0.25)] backdrop-blur-md transition-[background-color,border-color,color] duration-300",
            tone === "dark" && "dark"
          )}
        >
          <Link
            href="/"
            aria-label="OBEMA Marketing, página inicial"
            className="flex min-h-11 items-center rounded-full"
          >
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "relative inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground",
                      "aria-[current=page]:bg-foreground/[0.06] aria-[current=page]:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <Button asChild className="hidden sm:inline-flex">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" closeLabel="Fechar menu" className="dark w-full border-border sm:max-w-md">
                <SheetHeader className="px-6 pt-6">
                  <SheetTitle className="text-left">
                    <Logo />
                  </SheetTitle>
                  <SheetDescription className="text-left">
                    Estúdio de social media · {site.city}
                  </SheetDescription>
                </SheetHeader>
                <nav aria-label="Menu" className="px-6">
                  <ul className="flex flex-col">
                    {[{ href: "/", label: "Início" }, ...nav].map((item) => (
                      <li key={item.href} className="border-b border-border">
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            aria-current={
                              (item.href === "/" ? pathname === "/" : isActive(item.href)) ? "page" : undefined
                            }
                            className="flex min-h-16 items-center justify-between font-display text-3xl font-bold tracking-tight text-foreground/80 transition-colors hover:text-foreground aria-[current=page]:text-lime"
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
      </div>
    </header>
  );
}

/**
 * Olha o que está logo abaixo do cabeçalho e devolve "dark" quando é uma
 * seção azul-marinho de largura total (section/footer com .dark) ou o portal
 * da home já dentro da letra. Cards escuros soltos não contam.
 */
function useToneBelowHeader(pathname: string) {
  const [tone, setTone] = useState<"light" | "dark">("light");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const below = document
        .elementsFromPoint(window.innerWidth / 2, 44)
        .find((element) => !element.closest("header"));
      const portal = below?.closest<HTMLElement>(".home-portal");
      const next = portal
        ? below?.closest("[data-gp-content]") || Number(portal.dataset.gpProgress ?? 0) > 0.42
          ? "dark"
          : "light"
        : below?.closest("section.dark, footer.dark")
          ? "dark"
          : "light";
      setTone(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
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

  return tone;
}
