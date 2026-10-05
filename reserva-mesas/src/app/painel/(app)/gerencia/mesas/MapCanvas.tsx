"use client";

import { useRef } from "react";
import { BanIcon } from "@/components/icons";
import { clampPosition, overlaps } from "@/lib/mesas";
import type { DiningTableRow } from "@/lib/types";

type Drag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  rect: DOMRect;
  moved: boolean;
};

/**
 * Mapa editável de uma área: arrastar (mouse, toque ou caneta) posiciona a mesa;
 * com o teclado, setas movem 1% (Shift + seta, 5%). Toque sem arrastar seleciona.
 */
export function MapCanvas({
  tables,
  selectedId,
  neighborIds,
  onSelect,
  onMove,
  onMoveEnd,
}: {
  tables: DiningTableRow[];
  selectedId: string | null;
  /** Mesas que podem ser juntadas com a selecionada (destacadas em tracejado). */
  neighborIds: Set<string>;
  /** "tap" = toque/clique sem arrastar; "drag"/"key" = começou a mover. */
  onSelect: (id: string, via: "tap" | "drag" | "key") => void;
  /** Durante o arraste/teclado: só atualiza a tela. */
  onMove: (id: string, x: number, y: number) => void;
  /** Fim do movimento: grava no banco (com a posição final, sem depender do estado do pai). */
  onMoveEnd: (id: string, x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const keyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function positionFor(d: Drag, clientX: number, clientY: number, t: DiningTableRow) {
    const dx = ((clientX - d.startX) / d.rect.width) * 100;
    const dy = ((clientY - d.startY) / d.rect.height) * 100;
    return clampPosition(d.originX + dx, d.originY + dy, Number(t.width), Number(t.height));
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>, t: DiningTableRow) {
    if (e.button !== 0 || !canvasRef.current) return;
    drag.current = {
      id: t.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: Number(t.pos_x),
      originY: Number(t.pos_y),
      rect: canvasRef.current.getBoundingClientRect(),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>, t: DiningTableRow) {
    const d = drag.current;
    if (!d || d.id !== t.id || d.pointerId !== e.pointerId) return;
    // Pequenos tremores do dedo não contam como arraste
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 5) return;
    if (!d.moved) onSelect(t.id, "drag");
    d.moved = true;
    const p = positionFor(d, e.clientX, e.clientY, t);
    onMove(t.id, p.x, p.y);
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>, t: DiningTableRow) {
    const d = drag.current;
    if (!d || d.id !== t.id || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (d.moved) {
      const p = positionFor(d, e.clientX, e.clientY, t);
      onMove(t.id, p.x, p.y);
      onMoveEnd(t.id, p.x, p.y);
    } else {
      onSelect(t.id, "tap");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, t: DiningTableRow) {
    const step = e.shiftKey ? 5 : 1;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = delta[e.key];
    if (!move) return;
    e.preventDefault();
    onSelect(t.id, "key");
    const p = clampPosition(Number(t.pos_x) + move[0], Number(t.pos_y) + move[1], Number(t.width), Number(t.height));
    onMove(t.id, p.x, p.y);
    // Grava quando a pessoa para de apertar as setas
    if (keyTimer.current) clearTimeout(keyTimer.current);
    keyTimer.current = setTimeout(() => onMoveEnd(t.id, p.x, p.y), 500);
  }

  const overlapping = new Set(
    tables.flatMap((a) => tables.filter((b) => b.id !== a.id && overlaps(a, b)).map(() => a.id))
  );

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div
        ref={canvasRef}
        aria-label="Mapa da área (arraste as mesas para posicionar)"
        role="group"
        className="relative aspect-[16/10] w-full min-w-[520px] select-none rounded-card border border-stone-200 bg-[rgb(var(--c-stone-50))] bg-[size:5%_8%] [background-image:linear-gradient(to_right,rgb(var(--c-stone-200)/0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--c-stone-200)/0.6)_1px,transparent_1px)]"
      >
        {tables.map((t) => {
          const selected = t.id === selectedId;
          const neighbor = neighborIds.has(t.id);
          const overlap = overlapping.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onPointerDown={(e) => onPointerDown(e, t)}
              onPointerMove={(e) => onPointerMove(e, t)}
              onPointerUp={(e) => onPointerUp(e, t)}
              onPointerCancel={() => (drag.current = null)}
              onKeyDown={(e) => onKeyDown(e, t)}
              aria-pressed={selected}
              aria-label={`Mesa ${t.label}, ${t.min_seats} a ${t.max_seats} lugares${t.blocked ? ", bloqueada" : ""}${
                overlap ? ", sobreposta a outra mesa" : ""
              }. Arraste ou use as setas para mover.`}
              style={{ left: `${t.pos_x}%`, top: `${t.pos_y}%`, width: `${t.width}%`, height: `${t.height}%` }}
              className={`absolute flex cursor-grab touch-none flex-col items-center justify-center gap-0.5 overflow-hidden border-2 p-0.5 text-center shadow-sm transition-shadow active:cursor-grabbing focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/60 ${
                t.shape === "round" ? "rounded-full" : "rounded-xl"
              } ${
                t.blocked
                  ? "border-stone-400 bg-stone-200/80 text-stone-500"
                  : neighbor
                    ? "border-dashed border-brand bg-brand-soft text-brand-ink"
                    : "border-stone-300 bg-white text-stone-700"
              } ${selected ? "z-10 border-brand shadow-elevated ring-4 ring-brand/40" : ""} ${
                overlap ? "border-red-600" : ""
              }`}
            >
              <span className="text-sm font-bold leading-none text-stone-900 sm:text-base">{t.label}</span>
              <span className="flex items-center gap-0.5 text-[10px] font-medium leading-none sm:text-[11px]">
                {t.blocked && <BanIcon size={11} />}
                {t.min_seats === t.max_seats ? t.max_seats : `${t.min_seats}–${t.max_seats}`} lug.
              </span>
            </button>
          );
        })}
        {tables.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-stone-500">
            Nenhuma mesa nesta área ainda. Use &ldquo;Nova mesa&rdquo; para começar.
          </p>
        )}
      </div>
    </div>
  );
}
