"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoutIcon } from "@/components/icons";

type Props = {
  redirectTo?: string;
  variant?: "sidebar" | "header" | "menu-row";
};

export function LogoutButton({ redirectTo = "/login", variant = "sidebar" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-label="Sair"
        className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-60"
      >
        <LogoutIcon size={20} />
      </button>
    );
  }

  if (variant === "menu-row") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="flex min-h-tap w-full items-center gap-3 px-2 py-1.5 text-left disabled:opacity-60"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <LogoutIcon size={19} />
        </span>
        <span className="flex-1 text-sm font-medium text-red-600">{loading ? "Saindo..." : "Sair"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex min-h-tap w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium opacity-75 transition-colors hover:bg-white/10 hover:opacity-100 disabled:opacity-50"
    >
      <LogoutIcon size={20} />
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
