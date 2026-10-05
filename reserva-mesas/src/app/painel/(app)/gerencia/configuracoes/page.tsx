import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/restaurant";
import { friendlyErrorMessage } from "@/lib/constants";
import { ErrorState } from "@/components/ui/EmptyState";
import type { RestaurantSettingsRow } from "@/lib/types";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("restaurant_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return <ErrorState message={friendlyErrorMessage(error)} />;
  const s = data as RestaurantSettingsRow;
  return (
    <SettingsForm
      initial={{
        name: s.name,
        tagline: s.tagline,
        address: s.address,
        phone: s.phone,
        whatsapp: s.whatsapp,
        instagram: s.instagram,
        primary_color: s.primary_color,
        logo_url: s.logo_url,
        public_url: s.public_url,
      }}
      // O botão de reset só aparece com a flag do ambiente E o modo demo do banco ligados
      demoMode={isDemoMode() && s.demo_mode}
    />
  );
}
