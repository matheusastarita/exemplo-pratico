// Deriva a paleta da marca a partir de uma única cor (restaurant_settings.primary_color).
// Tudo em canais "R G B" pra encaixar em rgb(var(--c-brand) / <alpha>) do Tailwind.

export const DEFAULT_BRAND_COLOR = "#1B2A4B";

type RGB = [number, number, number];

const CREAM: RGB = [247, 243, 236];
const WHITE: RGB = [255, 255, 255];
const INK: RGB = [28, 25, 23];

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgb(hex: string): RGB {
  const clean = isValidHexColor(hex) ? hex : DEFAULT_BRAND_COLOR;
  return [1, 3, 5].map((i) => parseInt(clean.slice(i, i + 2), 16)) as RGB;
}

function mix(a: RGB, b: RGB, amountOfB: number): RGB {
  return a.map((c, i) => Math.round(c + (b[i] - c) * amountOfB)) as RGB;
}

function luminance([r, g, b]: RGB): number {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrastRatio(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const channels = (c: RGB) => c.join(" ");

/** Variáveis CSS da marca. Garante contraste AA mesmo se o dono escolher uma cor clara. */
export function brandCssVariables(hex: string): Record<string, string> {
  const brand = hexToRgb(hex);

  // Texto sobre o fundo da marca: branco se tiver contraste, senão a tinta escura.
  const contrast = contrastRatio(brand, WHITE) >= 4.5 ? WHITE : INK;

  // Versão "tinta": escurece a marca até ter contraste 4.5:1 com o creme do fundo.
  let ink = brand;
  for (let step = 0; step < 20 && contrastRatio(ink, CREAM) < 4.5; step++) {
    ink = mix(ink, [0, 0, 0], 0.12);
  }

  return {
    "--c-brand": channels(brand),
    "--c-brand-dark": channels(mix(brand, [0, 0, 0], 0.22)),
    "--c-brand-soft": channels(mix(brand, WHITE, 0.88)),
    "--c-brand-ink": channels(ink),
    "--c-brand-contrast": channels(contrast),
  };
}
