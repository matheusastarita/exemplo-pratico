"use client";

import { useEffect } from "react";
import { CheckCircleIcon, CloseIcon, AlertIcon } from "@/components/icons";

export type ToastData = {
  id: number;
  message: string;
  tone?: "success" | "error";
  actionLabel?: string;
  onAction?: () => void;
};

/** Aviso rápido no rodapé (some sozinho). Opcionalmente com ação, ex.: "Desfazer". */
export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, toast.tone === "error" ? 7000 : 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  const error = toast.tone === "error";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 lg:bottom-6">
      <div
        role={error ? "alert" : "status"}
        className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-control px-4 py-3 text-sm shadow-elevated ${
          error ? "bg-red-700 text-white" : "bg-stone-900 text-white"
        }`}
      >
        {error ? <AlertIcon size={18} className="shrink-0" /> : <CheckCircleIcon size={18} className="shrink-0" />}
        <p className="min-w-0 flex-1">{toast.message}</p>
        {toast.onAction && (
          <button
            type="button"
            onClick={() => {
              toast.onAction?.();
              onClose();
            }}
            className="min-h-9 shrink-0 rounded-full px-3 font-semibold underline-offset-2 hover:underline"
          >
            {toast.actionLabel ?? "Desfazer"}
          </button>
        )}
        <button type="button" onClick={onClose} aria-label="Fechar aviso" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10">
          <CloseIcon size={16} />
        </button>
      </div>
    </div>
  );
}
