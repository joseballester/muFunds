import type { CheerioAPI } from 'cheerio';

/**
 * Everything a source can report about an asset. A source leaves a field
 * undefined when it doesn't have it. Percentages are fractions (0.012 = 1.2%).
 */
export interface AssetData {
  nav?: number;
  date?: string;
  currency?: string;
  expenses?: number;
  category?: string;
  return1d?: number;
  return1m?: number;
  return3m?: number;
  return1y?: number;
  /** Annualized. */
  return3y?: number;
  /** Annualized. */
  return5y?: number;
  returnytd?: number;
}

export type Field = keyof AssetData;

export interface HttpResponse {
  status: number;
  body: string;
}

/** Side effects the sources depend on, passed in so tests can replace them. */
export interface Services {
  fetch(url: string): HttpResponse;
  loadHtml(html: string): CheerioAPI;
}

/** Looks up an asset and returns what it knows about it. */
export type Source = (id: string, services: Services) => AssetData;
