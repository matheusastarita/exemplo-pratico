import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PhoneFrame } from "@/components/site/phone-frame";
import { asset } from "@/lib/asset";
import { jmCase } from "@/lib/content";

export function CaseHighlight() {
  return (
    <section id="case" className="dark relative isolate overflow-hidden bg-background py-24 text-foreground md:py-32">
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-[10%] -z-10 aspect-square w-[min(80vw,760px)] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(201,240,60,0.13),transparent_70%)]"
      />
      <div className="wrap grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow">Case · {jmCase.segment}</p>
          <h2 className="mt-5 text-display font-bold tracking-[-0.035em]">{jmCase.name}</h2>
          <p className="mt-6 max-w-[48ch] text-lede text-muted-foreground">{jmCase.lede}</p>

          <ol className="mt-10 grid gap-0">
            {jmCase.after.map((item, i) => (
              <li key={item.title} data-reveal className="grid grid-cols-[auto_1fr] gap-x-5 border-t border-border py-5">
                <span className="font-mono text-xs leading-7 text-lime">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <Button asChild variant="outline" size="lg" className="mt-8">
            <Link href="/cases">
              Ver o case completo
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <figure className="relative">
          <PhoneFrame>
            <Image
              src={asset("/media/jm-print.webp")}
              alt="Perfil do Instituto J. Mortensen no Instagram depois do trabalho da OBEMA, com bio organizada, destaques e feed com identidade visual verde"
              fill
              sizes="300px"
              className="object-cover object-top"
            />
          </PhoneFrame>
          <figcaption className="mx-auto mt-6 max-w-[30ch] text-center text-sm text-muted-foreground">
            O perfil real, hoje.{" "}
            <a href={jmCase.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
              {jmCase.handle}
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
