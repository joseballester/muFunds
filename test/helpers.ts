import { readFileSync } from 'node:fs';

import * as cheerio from 'cheerio';

import type { HttpResponse, Services } from '../src/types.ts';

export function readFixture(name: string): string {
  return readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');
}

/** A plain string answers with status 200. */
type Handler = (url: string) => HttpResponse | string;

/** Services whose `fetch` is answered by `handler`. Every requested URL is kept in `requests`. */
export function fakeServices(handler: Handler): Services & { requests: string[] } {
  const requests: string[] = [];
  return {
    requests,
    fetch(url) {
      requests.push(url);
      const response = handler(url);
      return typeof response === 'string' ? { status: 200, body: response } : response;
    },
    loadHtml: (html) => cheerio.load(html),
  };
}

export function queryParam(url: string, name: string): string | null {
  return new URL(url).searchParams.get(name);
}
