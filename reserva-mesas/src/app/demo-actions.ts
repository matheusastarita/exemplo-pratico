"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/auth";

type DemoRole = "manager" | "host" | "client";

// As credenciais de demonstração ficam SÓ em variáveis de ambiente do servidor
// (nunca no código nem no navegador). Ver .env.local.example e README.
const CREDENTIALS: Record<DemoRole, [string, string]> = {
  manager: ["DEMO_MANAGER_EMAIL", "DEMO_MANAGER_PASSWORD"],
  host: ["DEMO_HOST_EMAIL", "DEMO_HOST_PASSWORD"],
  client: ["DEMO_CLIENT_EMAIL", "DEMO_CLIENT_PASSWORD"],
};

/** Entrada rápida da apresentação. Só funciona com NEXT_PUBLIC_DEMO_MODE=true. */
export async function demoSignIn(role: DemoRole): Promise<{ error: string }> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true" || !(role in CREDENTIALS)) {
    return { error: "A entrada rápida só existe no ambiente de demonstração." };
  }

  const [emailVar, passwordVar] = CREDENTIALS[role];
  const email = process.env[emailVar];
  const password = process.env[passwordVar];
  if (!email || !password) {
    return { error: "Conta de demonstração não configurada. Veja o README." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { error: "Não foi possível entrar na conta de demonstração." };
  }

  redirect(homeForRole(role));
}
