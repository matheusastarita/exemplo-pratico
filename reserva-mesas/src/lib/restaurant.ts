import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BRAND_COLOR } from "@/lib/brand";
import type { PublicInfo } from "@/lib/types";

const FALLBACK: PublicInfo = {
  name: "Restaurante",
  tagline: null,
  address: null,
  phone: null,
  whatsapp: null,
  instagram: null,
  primary_color: DEFAULT_BRAND_COLOR,
  logo_url: null,
  slot_step_minutes: 15,
  min_notice_minutes: 60,
  max_advance_days: 60,
  max_party_online: 10,
  cancel_deadline_hours: 4,
  grace_minutes: 15,
  waitlist_enabled: false,
  deposit_enabled: false,
  deposit_min_party: null,
  deposit_per_person: null,
  demo_mode: false,
  today: new Date().toISOString().slice(0, 10),
  areas: [],
  shifts: [],
  closures: [],
};

/**
 * Dados públicos do restaurante (marca, contatos, regras, turnos). Um fetch por
 * requisição (React cache) — o layout raiz e a página usam o mesmo resultado.
 * Se o banco não responder, devolve um padrão neutro pra página não quebrar.
 */
export const getPublicInfo = cache(async (): Promise<{ info: PublicInfo; ok: boolean }> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_info");
    if (error || !data) return { info: FALLBACK, ok: false };
    return { info: data, ok: true };
  } catch {
    return { info: FALLBACK, ok: false };
  }
});

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
