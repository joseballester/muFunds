import { HttpError } from './errors.ts';
import type { Services } from './types.ts';

/** Fetches a URL and returns its body, throwing `HttpError` on a non-2xx status. */
export function fetchText(services: Services, url: string): string {
  const { status, body } = services.fetch(url);
  if (status < 200 || status >= 300) {
    throw new HttpError(url, status);
  }
  return body;
}

export function fetchJson<T>(services: Services, url: string): T {
  return JSON.parse(fetchText(services, url)) as T;
}
