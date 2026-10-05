import { requireManager } from "@/lib/session";

/** Toda a área /painel/gerencia exige gerente (checado no servidor, a cada requisição). */
export default async function GerenciaLayout({ children }: { children: React.ReactNode }) {
  await requireManager();
  return children;
}
