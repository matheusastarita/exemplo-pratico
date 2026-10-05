import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

import { services } from "@/lib/content";
import { cn } from "@/lib/utils";

export function ServicesGrid() {
  const [featured, ...rest] = services;
  const FeaturedIcon = featured.icon;

  return (
    <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <li data-reveal className="md:col-span-2 lg:row-span-2">
        <Link
          href={`/servicos#${featured.slug}`}
          className="dark group relative flex h-full min-h-80 flex-col overflow-hidden rounded-xl bg-background p-7 text-foreground transition-transform duration-500 ease-brand hover:-translate-y-1 md:p-10"
        >
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-24 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(201,240,60,0.22),transparent)]"
          />
          <div className="flex items-start justify-between">
            <span className="grid size-14 place-items-center rounded-2xl bg-lime text-navy">
              <FeaturedIcon className="size-6" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs text-muted-foreground">01 / 08</span>
          </div>
          <h3 className="mt-auto pt-16 text-title font-bold tracking-[-0.03em]">{featured.title}</h3>
          <p className="mt-4 max-w-[46ch] text-muted-foreground">{featured.description}</p>
          <ul className="mt-6 grid gap-2 text-sm">
            {featured.includes.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 text-lime" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-lime">
            Ver detalhes
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
        </Link>
      </li>

      {rest.map((service, i) => {
        const Icon = service.icon;
        return (
          <li key={service.slug} data-reveal className={cn(i === rest.length - 1 && "lg:col-span-2")}>
            <Link
              href={`/servicos#${service.slug}`}
              className="group flex h-full min-h-60 flex-col rounded-xl border border-border bg-card p-6 transition-[transform,box-shadow,border-color] duration-500 ease-brand hover:-translate-y-1 hover:border-navy/30 hover:shadow-[0_20px_40px_-24px_rgba(7,18,34,0.35)]"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-navy text-lime">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <ArrowUpRight
                  className="size-5 text-muted-foreground transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>
              <span className="mt-auto pt-10 font-mono text-xs text-muted-foreground">
                {String(i + 2).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-xl font-bold tracking-tight">{service.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{service.summary}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
