/**
 * Caminho de um arquivo de /public. Fora da raiz do domínio (GitHub Pages),
 * o Next não prefixa sozinho o src de <video> e de next/image.
 */
export function asset(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
