/** Placeholder that quefondos.com shows for missing values. */
const MISSING_VALUE = '·';

/** Collapses whitespace. Returns undefined for empty or placeholder text. */
export function cleanText(text: string | undefined): string | undefined {
  const cleaned = text?.replace(/\s+/g, ' ').trim();
  return cleaned && cleaned !== MISSING_VALUE ? cleaned : undefined;
}

/** Parses a number in Spanish format, like "1.234,56" or "-0,5". */
export function parseSpanishNumber(text: string | undefined): number | undefined {
  const cleaned = cleanText(text)?.replace(/\s/g, '');
  if (!cleaned) {
    return undefined;
  }

  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;

  return /^[-+]?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : undefined;
}

/** Parses a Spanish-format percentage, like "0,24%", into a fraction (0.0024). */
export function parseSpanishPercent(text: string | undefined): number | undefined {
  const value = parseSpanishNumber(cleanText(text)?.replace(/%$/, ''));
  return value === undefined ? undefined : value / 100;
}

/** Converts a cumulative return over `years` into an annualized one, rounded to 4 decimals. */
export function annualize(cumulativeReturn: number, years: number): number {
  return Math.round(((1 + cumulativeReturn) ** (1 / years) - 1) * 10_000) / 10_000;
}

/** Divides by 100 when the value is defined. Sources report most percentages as 0-100. */
export function fromPercent(value: number | undefined): number | undefined {
  return value === undefined ? undefined : value / 100;
}
