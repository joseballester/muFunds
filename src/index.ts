import { appsScriptServices } from './apps-script.ts';
import { type ErrorCode, MuFundsError, toMuFundsError } from './errors.ts';
import { isMistypedIsin } from './isin.ts';
import { resolveSource } from './sources/index.ts';
import type { AssetData, Cache, Field, Services } from './types.ts';

/** How long a successful lookup is reused. Prices change once a day, so this cuts requests without going stale for long. */
const CACHE_SECONDS = 2 * 60 * 60;

/**
 * How long a lookup that failed with one of `CACHED_ERRORS` is reused. Sheets recalculate
 * often, and every option of a row is a separate cell, so without this one missing ID can
 * fetch dozens of times in minutes and use up the user's daily UrlFetch quota. An hour stops
 * that, and lets a newly listed fund show up soon.
 */
const ERROR_CACHE_SECONDS = 60 * 60;

/**
 * Errors that say something about the ID, not about the source's health, so asking again
 * soon gets the same answer. Transient ones like `SOURCE_UNAVAILABLE` and `QUOTA_EXCEEDED`
 * are never cached.
 */
const CACHED_ERRORS: ReadonlySet<ErrorCode> = new Set(['ASSET_NOT_FOUND', 'AMBIGUOUS_ID']);

/** Part of every cache key. Change it when `CacheEntry` or `AssetData` changes shape, so old entries are ignored. */
const CACHE_VERSION = 'v2';

/** What a cache entry holds: the asset's data, or the error its lookup failed with. */
type CacheEntry = { data: AssetData } | { error: { code: ErrorCode; internalMessage: string } };

const FIELDS = [
  'nav',
  'date',
  'currency',
  'expenses',
  'category',
  'return1d',
  'return1m',
  'return3m',
  'return1y',
  'return3y',
  'return5y',
  'returnytd',
] as const satisfies readonly Field[];

/** Values accepted for the `option` argument, mapped to the field they return. */
const OPTIONS = new Map<string, Field>([...FIELDS.map((field) => [field, field] as const), ['change', 'return1d']]);

/** The error values Google Sheets shows in a cell. A formula referencing such a cell gets it as this string. */
const SHEETS_ERRORS = new Set(['#REF!', '#ERROR!', '#N/A', '#NAME?', '#VALUE!', '#DIV/0!', '#NUM!', '#NULL!']);

/**
 * Returns one value for an asset. Always throws `MuFundsError`: anything
 * unexpected from a source is wrapped as `SOURCE_UNAVAILABLE`.
 */
export function getAssetValue(option: unknown, id: unknown, source: unknown, services: Services): string | number {
  const field = OPTIONS.get(normalize(option));
  if (!field) {
    throw new MuFundsError('UNKNOWN_OPTION');
  }

  const assetId = String(id ?? '').trim();
  if (!assetId) {
    throw new MuFundsError('EMPTY_ID');
  }
  if (SHEETS_ERRORS.has(assetId)) {
    throw new MuFundsError('ID_IS_ERROR');
  }
  if (isMistypedIsin(assetId)) {
    throw new MuFundsError('INVALID_ISIN');
  }

  const { name, load } = resolveSource(source);
  let data: AssetData;
  try {
    data = loadCached(services.cache, `${CACHE_VERSION}:${name}:${assetId}`, () => load(assetId, services));
  } catch (error) {
    throw toMuFundsError(error);
  }

  const value = data[field];
  if (value === undefined) {
    throw new MuFundsError('DATA_NOT_AVAILABLE');
  }
  return value;
}

/**
 * Returns the cached data for `key`, or calls `load` and caches its result.
 * Errors in `CACHED_ERRORS` are cached too, and thrown again on a hit with the same code
 * and internal message. Any other error isn't cached, so that lookup is tried again next time.
 * One entry holds every field, or the error, so cells asking for different options of an asset share it.
 */
function loadCached(cache: Cache, key: string, load: () => AssetData): AssetData {
  const cached = cache.get(key);
  if (cached !== null) {
    const entry = JSON.parse(cached) as CacheEntry;
    if ('error' in entry) {
      throw new MuFundsError(entry.error.code, { internalMessage: entry.error.internalMessage });
    }
    return entry.data;
  }

  let data: AssetData;
  try {
    data = load();
  } catch (error) {
    if (error instanceof MuFundsError && CACHED_ERRORS.has(error.code)) {
      const entry: CacheEntry = { error: { code: error.code, internalMessage: error.internalMessage } };
      cache.put(key, JSON.stringify(entry), ERROR_CACHE_SECONDS);
    }
    throw error;
  }
  const entry: CacheEntry = { data };
  cache.put(key, JSON.stringify(entry), CACHE_SECONDS);
  return data;
}

/** The `=muFunds()` custom function, wired to Apps Script services. */
export function muFunds(option: unknown, id: unknown, source: unknown): string | number {
  try {
    return getAssetValue(option, id, source, appsScriptServices());
  } catch (caught) {
    const error = toMuFundsError(caught);
    if (error.severity === 'NONE') {
      throw error;
    }
    // Logger, unlike console, sends objects to Cloud Logging as a structured jsonPayload.
    // `message` is the summary line in Logs Explorer, so it gets the detailed internal message.
    const entry = {
      errorCode: error.code,
      message: error.internalMessage,
      userMessage: error.message,
      context: {
        option,
        id,
        source,
        // For a wrapped error, the original stack is the useful one.
        stack: error.cause instanceof Error ? error.cause.stack : error.stack,
      },
    };
    if (error.severity === 'ERROR') {
      Logger.severe(entry); // Shows as ERROR.
    } else {
      Logger.log(entry); // Shows as INFO.
    }
    throw error;
  }
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}
