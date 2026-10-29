import { execFileSync } from 'node:child_process';

import * as cheerio from 'cheerio';

import type { HttpResponse, Services } from '../../src/types.ts';

// The app's code is synchronous, like Apps Script, so each request runs in a child process.
const FETCH_SCRIPT = `
const response = await fetch(process.argv[1]);
process.stdout.write(JSON.stringify({ status: response.status, body: await response.text() }));
`;

// Many tests ask for the same asset, so each URL is fetched once per test file.
const cache = new Map<string, HttpResponse>();

function fetchSync(url: string): HttpResponse {
  let response = cache.get(url);
  if (!response) {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', FETCH_SCRIPT, url], {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    });
    response = JSON.parse(output) as HttpResponse;
    cache.set(url, response);
  }
  return response;
}

/**
 * Services that make real requests. `fetch` can be wrapped, e.g. to simulate an outage.
 * Asset data isn't cached, so every test runs the source's code.
 */
export function liveServices(wrapFetch: (fetch: Services['fetch']) => Services['fetch'] = (fetch) => fetch): Services {
  return {
    fetch: wrapFetch(fetchSync),
    loadHtml: (html) => cheerio.load(html),
    cache: { get: () => null, put: () => {} },
  };
}

/** Every value of the `option` argument. */
export const OPTIONS = [
  'nav',
  'date',
  'currency',
  'expenses',
  'category',
  'change',
  'return1d',
  'return1m',
  'return3m',
  'return1y',
  'return3y',
  'return5y',
  'returnytd',
] as const;

export type Option = (typeof OPTIONS)[number];

export const RETURN_OPTIONS = OPTIONS.filter((option) => option.startsWith('return'));
