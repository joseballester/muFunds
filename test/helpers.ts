import { readFileSync } from 'node:fs';

import * as cheerio from 'cheerio';

import type { Cache, HttpResponse, Services } from '../src/types.ts';

export function readFixture(name: string): string {
  return readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');
}

/** A plain string answers with status 200. */
type Handler = (url: string) => HttpResponse | string;

/** An in-memory cache. Entries never expire; `entries` keeps each value with its expiration. */
export function memoryCache(): Cache & { entries: Map<string, { value: string; expirationInSeconds: number }> } {
  const entries = new Map<string, { value: string; expirationInSeconds: number }>();
  return {
    entries,
    get: (key) => entries.get(key)?.value ?? null,
    put: (key, value, expirationInSeconds) => {
      entries.set(key, { value, expirationInSeconds });
    },
  };
}

/**
 * Services whose `fetch` is answered by `handler`. Every requested URL is kept in `requests`.
 * Each call gets its own empty cache.
 */
export function fakeServices(
  handler: Handler,
): Services & { requests: string[]; cache: ReturnType<typeof memoryCache> } {
  const requests: string[] = [];
  return {
    requests,
    fetch(url) {
      requests.push(url);
      const response = handler(url);
      return typeof response === 'string' ? { status: 200, body: response } : response;
    },
    loadHtml: (html) => cheerio.load(html),
    cache: memoryCache(),
  };
}

export function queryParam(url: string, name: string): string | null {
  return new URL(url).searchParams.get(name);
}
