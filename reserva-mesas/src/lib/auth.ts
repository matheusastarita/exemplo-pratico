import { CLIENT_HOME, MANAGER_HOME, STAFF_HOME } from "./constants";
import type { Role } from "./types";

/** Para onde cada papel vai depois de entrar. */
export function homeForRole(role: Role | null | undefined): string {
  if (role === "manager") return MANAGER_HOME;
  if (role === "host") return STAFF_HOME;
  return CLIENT_HOME;
}

// Destinos internos permitidos no parâmetro "next" (login e /auth/callback).
// Nunca repassar "next" sem checar contra esta lista fixa (evita open redirect).
const ALLOWED_NEXT = new Set([
  "/minhas-reservas",
  "/perfil",
  "/reservar",
  "/atualizar-senha",
  "/painel",
  "/painel/gerencia",
]);

export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  return ALLOWED_NEXT.has(next) ? next : null;
}
