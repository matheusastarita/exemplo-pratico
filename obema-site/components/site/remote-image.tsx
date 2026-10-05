"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Foto externa (Unsplash) com fundo da marca por baixo. Se a imagem não
 * carregar, o bloco continua com o gradiente em vez de um ícone quebrado.
 */
export function RemoteImage({ className, alt, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[radial-gradient(circle_at_20%_15%,rgba(201,240,60,0.22),transparent_40%),linear-gradient(140deg,#122849,#0b1b34_60%,#071222)]",
        className
      )}
    >
      <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-60" />
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[clamp(18px,3vw,40px)] border-lime/80"
      />
      {failed ? null : (
        <Image
          {...props}
          alt={alt}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
