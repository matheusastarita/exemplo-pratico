import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/types";

/** Usuário + perfil da requisição atual (um fetch por requisição). */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, active, birthday, preferences, created_at")
    .eq("id", user.id)
    .single<ProfileRow>();

  return { user, profile };
});

/** Exige equipe ativa (anfitrião ou gerente). Senão, manda para o login da equipe. */
export async function requireStaff(next = "/painel") {
  const { user, profile } = await getSession();
  if (!user) redirect(`/painel/entrar?next=${encodeURIComponent(next)}`);
  if (!profile?.active || (profile.role !== "host" && profile.role !== "manager")) {
    redirect("/painel/entrar");
  }
  return { user, profile };
}

/** Exige gerente. Anfitrião que tentar abrir a gerência volta para o salão. */
export async function requireManager() {
  const session = await requireStaff("/painel/gerencia");
  if (session.profile.role !== "manager") redirect("/painel");
  return session;
}

/** Exige login (área do cliente). */
export async function requireUser(next = "/minhas-reservas") {
  const { user, profile } = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { user, profile };
}
