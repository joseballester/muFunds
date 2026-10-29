import { appsScriptServices } from './apps-script.ts';
import { MuFundsError, toMuFundsError } from './errors.ts';
import { resolveSource } from './sources/index.ts';
import type { AssetData, Field, Services } from './types.ts';

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

  const load = resolveSource(source);
  let data: AssetData;
  try {
    data = load(assetId, services);
  } catch (error) {
    throw toMuFundsError(error);
  }

  const value = data[field];
  if (value === undefined) {
    throw new MuFundsError('DATA_NOT_AVAILABLE');
  }
  return value;
}

/** The `=muFunds()` custom function, wired to Apps Script services. */
export function muFunds(option: unknown, id: unknown, source: unknown): string | number {
  try {
    return getAssetValue(option, id, source, appsScriptServices());
  } catch (caught) {
    const error = toMuFundsError(caught);
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
