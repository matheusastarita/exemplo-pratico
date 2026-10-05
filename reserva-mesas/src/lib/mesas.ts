import type { DiningTableRow, TableShape } from "./types";

// Regras do editor de mapa. As posições e tamanhos são em % do mapa da área
// (0–100), iguais às do banco.

/** Mesma distância usada no banco (find_table_options) para juntar duas mesas vizinhas. */
export const COMBINE_DISTANCE = 26;

export type SizeKey = "p" | "m" | "g";

export const SIZE_LABEL: Record<SizeKey, string> = { p: "Pequena", m: "Média", g: "Grande" };

/** Tamanhos prontos por formato (largura × altura em % do mapa 16:10). */
export const SIZE_PRESETS: Record<TableShape, Record<SizeKey, { width: number; height: number }>> = {
  round: { p: { width: 10, height: 14 }, m: { width: 12, height: 16 }, g: { width: 15, height: 20 } },
  square: { p: { width: 10, height: 13 }, m: { width: 12, height: 15 }, g: { width: 15, height: 19 } },
  rect: { p: { width: 16, height: 12 }, m: { width: 20, height: 14 }, g: { width: 26, height: 18 } },
};

export const SHAPE_LABEL: Record<TableShape, string> = { round: "Redonda", square: "Quadrada", rect: "Retangular" };

export function sizeKeyOf(t: Pick<DiningTableRow, "shape" | "width" | "height">): SizeKey | null {
  const presets = SIZE_PRESETS[t.shape];
  for (const key of ["p", "m", "g"] as SizeKey[]) {
    if (presets[key].width === Number(t.width) && presets[key].height === Number(t.height)) return key;
  }
  return null;
}

/** "1, 2, 10, V1" — números em ordem numérica, não alfabética. */
export function compareLabels(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
}

/** Mantém a mesa inteira dentro do mapa. */
export function clampPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const round = (n: number) => Math.round(n * 2) / 2; // passo de 0,5%
  return {
    x: round(Math.min(Math.max(0, x), 100 - width)),
    y: round(Math.min(Math.max(0, y), 100 - height)),
  };
}

type Box = Pick<DiningTableRow, "pos_x" | "pos_y" | "width" | "height">;

export function overlaps(a: Box, b: Box): boolean {
  return (
    Number(a.pos_x) < Number(b.pos_x) + Number(b.width) &&
    Number(b.pos_x) < Number(a.pos_x) + Number(a.width) &&
    Number(a.pos_y) < Number(b.pos_y) + Number(b.height) &&
    Number(b.pos_y) < Number(a.pos_y) + Number(a.height)
  );
}

function center(t: Box) {
  return { x: Number(t.pos_x) + Number(t.width) / 2, y: Number(t.pos_y) + Number(t.height) / 2 };
}

/** Mesas que o sistema pode juntar com esta (mesma área, ambas combináveis e próximas no mapa). */
export function combinableNeighbors(table: DiningTableRow, tables: DiningTableRow[]): DiningTableRow[] {
  if (!table.combinable) return [];
  const c = center(table);
  return tables
    .filter((t) => t.id !== table.id && t.active && t.combinable && t.area_id === table.area_id)
    .filter((t) => {
      const o = center(t);
      return Math.hypot(c.x - o.x, c.y - o.y) <= COMBINE_DISTANCE;
    })
    .sort((a, b) => compareLabels(a.label, b.label));
}

/** Primeiro lugar livre do mapa para uma mesa nova (varre em linhas, de cima para baixo). */
export function findFreeSpot(tables: Box[], width: number, height: number): { x: number; y: number } {
  for (let y = 4; y <= 100 - height - 2; y += 4) {
    for (let x = 4; x <= 100 - width - 2; x += 4) {
      const candidate = { pos_x: x, pos_y: y, width: width + 2, height: height + 2 };
      if (!tables.some((t) => overlaps(candidate, t))) return { x, y };
    }
  }
  return clampPosition(50 - width / 2, 50 - height / 2, width, height);
}

/** Próximo nome livre: segue o padrão da área ("V3" -> "V4"; "12" -> "13"). */
export function nextLabel(areaTables: DiningTableRow[], allTables: DiningTableRow[]): string {
  const taken = new Set(allTables.map((t) => t.label.toUpperCase()));
  const sample = [...areaTables].sort((a, b) => compareLabels(a.label, b.label)).pop()?.label ?? "";
  const match = sample.match(/^(.*?)(\d+)$/);
  const prefix = match ? match[1] : "";
  let n = match ? Number(match[2]) + 1 : allTables.length + 1;
  while (taken.has(`${prefix}${n}`.toUpperCase())) n++;
  return `${prefix}${n}`;
}
