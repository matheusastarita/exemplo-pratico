import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, safeNextPath } from "@/lib/auth";

// Troca o código do link de e-mail (confirmação/recuperação de senha) por uma sessão
// e redireciona só para destinos de uma lista fixa (anti open redirect).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (next) return NextResponse.redirect(`${origin}${next}`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return NextResponse.redirect(`${origin}${homeForRole(profile?.role)}`);
}
