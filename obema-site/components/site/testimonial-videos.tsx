"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

import { testimonials } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Depoimentos em vídeo: nada toca sozinho, um vídeo pausa os outros. */
export function TestimonialVideos({ className }: { className?: string }) {
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [started, setStarted] = useState<number[]>([]);

  const start = (index: number) => {
    setStarted((list) => (list.includes(index) ? list : [...list, index]));
    void videos.current[index]?.play();
  };

  const pauseOthers = (index: number) => {
    videos.current.forEach((video, i) => {
      if (video && i !== index && !video.paused) video.pause();
    });
  };

  return (
    <ul
      className={cn(
        "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0",
        className
      )}
    >
      {testimonials.map((person, i) => {
        const isStarted = started.includes(i);
        return (
          <li key={person.name} data-reveal className="w-[72%] shrink-0 snap-start sm:w-auto">
            <figure>
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-ink">
                <video
                  ref={(node) => {
                    videos.current[i] = node;
                  }}
                  src={person.video}
                  poster={person.poster}
                  preload="none"
                  playsInline
                  controls={isStarted}
                  onPlay={() => pauseOthers(i)}
                  className="h-full w-full object-cover"
                  aria-label={`Depoimento em vídeo de ${person.name}${person.company ? `, ${person.company}` : ""}`}
                />
                {isStarted ? null : (
                  <button
                    type="button"
                    onClick={() => start(i)}
                    className="group absolute inset-0 grid cursor-pointer place-items-center bg-gradient-to-t from-ink/80 via-ink/10 to-transparent"
                  >
                    <span className="grid size-16 place-items-center rounded-full bg-white text-navy shadow-lg transition-transform duration-300 ease-brand group-hover:scale-110">
                      <Play className="size-6 translate-x-0.5 fill-current" aria-hidden="true" />
                    </span>
                    <span className="sr-only">Assistir depoimento de {person.name}</span>
                  </button>
                )}
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between gap-4">
                <span className="font-display text-xl font-bold">{person.name}</span>
                <span className="text-right text-sm text-muted-foreground">
                  {person.company ? (
                    <>
                      {person.company}
                      <br />
                    </>
                  ) : null}
                  {person.city}
                </span>
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
