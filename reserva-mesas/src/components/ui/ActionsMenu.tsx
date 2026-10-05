"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoreIcon } from "@/components/icons";

export type ActionItem = {
  label: string;
  onSelect?: () => void;
  href?: string;
  tone?: "danger";
  disabled?: boolean;
};

const ITEM_HEIGHT = 44;
const MENU_WIDTH = 220;

/** Menu "···" de uma linha. Abre em posição fixa pra não ser cortado por tabela/scroll. */
export function ActionsMenu({
  items,
  label,
  disabled = false,
  trigger,
  triggerClassName,
}: {
  items: ActionItem[];
  label: string;
  disabled?: boolean;
  /** Conteúdo do botão que abre o menu. Padrão: o ícone "···". */
  trigger?: React.ReactNode;
  triggerClassName?: string;
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setPosition(null), []);
  const open = position !== null;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(
          menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]:not(:disabled)") ?? []
        );
        const index = items.indexOf(document.activeElement as HTMLElement);
        const next = e.key === "ArrowDown" ? index + 1 : index - 1;
        items[(next + items.length) % items.length]?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]:not(:disabled)")?.focus();

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  if (items.length === 0) return null;

  function toggle() {
    if (open) return close();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = items.length * ITEM_HEIGHT + 8;
    const fitsBelow = rect.bottom + 6 + height <= window.innerHeight;
    setPosition({
      top: fitsBelow ? rect.bottom + 6 : Math.max(8, rect.top - 6 - height),
      left: Math.min(window.innerWidth - MENU_WIDTH - 8, Math.max(8, rect.right - MENU_WIDTH)),
    });
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          triggerClassName ??
          "flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
        }
      >
        {trigger ?? <MoreIcon size={18} />}
      </button>

      {position && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="fixed z-[60] rounded-control border border-stone-200 bg-white p-1 shadow-elevated"
        >
          {items.map((item) => {
            const className = `flex h-11 w-full items-center rounded-lg px-3 text-left text-sm transition-colors disabled:opacity-50 ${
              item.tone === "danger"
                ? "text-red-600 hover:bg-red-50"
                : "text-stone-800 hover:bg-stone-100"
            }`;
            return item.href ? (
              <a
                key={item.label}
                role="menuitem"
                href={item.href}
                onClick={close}
                className={className}
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  close();
                  item.onSelect?.();
                }}
                className={className}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
