"use client";

import Image from "next/image";
import { useState } from "react";

import { PhoneFrame } from "@/components/site/phone-frame";
import { asset } from "@/lib/asset";
import { jmCase } from "@/lib/content";
import { cn } from "@/lib/utils";

type View = "antes" | "depois";

/** Antes e depois do perfil do Instituto J. Mortensen, trocados por botão. */
export function CaseCompare() {
  const [view, setView] = useState<View>("depois");
  const notes = view === "antes" ? jmCase.before : jmCase.after;

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-16">
      <div className="order-2 lg:order-1">
        <p className="eyebrow">{view === "antes" ? "Como estava" : "Como ficou"}</p>
        <ol className="mt-6 grid" aria-live="polite">
          {notes.map((note, i) => (
            <li key={note.title} className="grid grid-cols-[auto_1fr] gap-x-5 border-t border-border py-5">
              <span className={cn("font-mono text-xs leading-7", view === "depois" ? "text-lime" : "text-muted-foreground")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-lg font-bold">{note.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{note.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="order-1 flex flex-col items-center gap-6 lg:order-2">
        <div role="group" aria-label="Ver o perfil" className="inline-flex rounded-full border border-border bg-card p-1">
          {(["antes", "depois"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={cn(
                "min-h-11 min-w-28 cursor-pointer rounded-full px-5 text-sm font-semibold capitalize transition-colors",
                view === option ? "bg-lime text-navy" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <PhoneFrame className="w-[min(78vw,300px)]">
          {view === "depois" ? (
            <Image
              src={asset("/media/jm-print.webp")}
              alt="Perfil do Instituto J. Mortensen no Instagram depois do trabalho da OBEMA: bio organizada, destaques com função e feed com identidade visual verde"
              fill
              sizes="300px"
              className="object-cover object-top"
            />
          ) : (
            <EmptyProfile />
          )}
        </PhoneFrame>
        <p className="text-center text-xs text-muted-foreground">
          {view === "depois" ? "O perfil real, hoje." : "Reconstituição do perfil antes do trabalho."}
        </p>
      </div>

      <div className="order-3 hidden lg:block">
        <blockquote className="font-display text-title font-bold tracking-tight">“{jmCase.quote}”</blockquote>
        <p className="mt-4 text-sm text-muted-foreground">
          Perfil{" "}
          <a href={jmCase.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
            {jmCase.handle}
          </a>
        </p>
      </div>
    </div>
  );
}

/** Perfil zerado, desenhado em CSS (sem print). */
function EmptyProfile() {
  return (
    <div role="img" aria-label="Perfil do Instagram vazio: 0 publicações, bio sem descrição e sem link, nenhum destaque" className="flex h-full flex-col bg-white px-4 pt-10 text-[11px] text-neutral-900">
      <div className="flex items-center justify-between font-semibold">
        <span aria-hidden="true">‹</span>
        <span>institutojmortensen</span>
        <span aria-hidden="true">···</span>
      </div>
      <div className="mt-5 flex items-center gap-5">
        <span className="size-16 shrink-0 rounded-full bg-neutral-200" />
        <div className="grid flex-1 grid-cols-3 text-center">
          {[
            ["0", "posts"],
            ["1", "seguidor"],
            ["4", "seguindo"],
          ].map(([n, label]) => (
            <span key={label} className="flex flex-col">
              <b className="text-sm">{n}</b>
              <span className="text-neutral-500">{label}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 font-semibold">institutojmortensen</p>
      <p className="text-neutral-400">Sem descrição · sem link</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className="rounded-md bg-sky-500 py-1.5 text-center font-semibold text-white">Seguir</span>
        <span className="rounded-md bg-neutral-100 py-1.5 text-center font-semibold">Mensagem</span>
      </div>
      <div className="mt-4 flex flex-col items-start gap-1">
        <span className="grid size-12 place-items-center rounded-full border border-neutral-300 text-lg text-neutral-400">+</span>
        <span className="text-[10px]">Novo</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-0.5 border-t border-neutral-200 pt-0.5">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="aspect-square bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
