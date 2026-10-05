// CSV para o Excel em português: separador ";" e BOM (acentos corretos ao abrir).

function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  // aspas quando há separador, aspas ou quebra de linha; neutraliza fórmulas (=, +, -, @)
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const blob = new Blob(["﻿" + toCSV(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
