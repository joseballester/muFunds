export type Severity = 'INFO' | 'ERROR';

/**
 * Every error muFunds reports. `message` is shown to the user in the cell.
 * `internalMessage` is the default summary for the logs; throw sites can replace
 * it with something more specific. `severity` sets the log level: INFO for bad
 * input or missing data, ERROR for failures that need a look.
 */
export const ERRORS = {
  UNKNOWN_OPTION: {
    severity: 'INFO',
    internalMessage: 'Unknown option',
    message: 'Unknown option. Check the docs at mufunds.com/usage.html',
  },
  EMPTY_ID: {
    severity: 'INFO',
    internalMessage: 'Empty asset ID',
    message: 'Asset identifier is empty.',
  },
  UNKNOWN_SOURCE: {
    severity: 'INFO',
    internalMessage: 'Unknown source',
    message: 'Unknown data source. Check the docs at mufunds.com/usage.html',
  },
  ASSET_NOT_FOUND: {
    severity: 'INFO',
    internalMessage: 'Asset not found',
    message: 'Asset not found. Please use another identifier and/or data source.',
  },
  AMBIGUOUS_ID: {
    severity: 'INFO',
    internalMessage: 'Several assets match the ID',
    message:
      'Multiple results found (e.g. multi-listed stocks/ETFs). Please use a unique or alternative identifier. Check the docs at mufunds.com/troubleshooting.html',
  },
  DATA_NOT_AVAILABLE: {
    severity: 'INFO',
    internalMessage: 'Option not available for this asset',
    message: 'Requested data is not available for this asset from this data source. Please try a different source.',
  },
  /** The user's Google account ran out of its daily UrlFetch quota. A usage limit, not a failure. */
  QUOTA_EXCEEDED: {
    severity: 'INFO',
    internalMessage: 'UrlFetch daily quota exceeded',
    message:
      'Your Google account has reached its daily limit of data requests. Values will load again within 24 hours. Check the docs at mufunds.com/troubleshooting.html',
  },
  /** Anything unexpected: network failures, odd responses, bugs. */
  SOURCE_UNAVAILABLE: {
    severity: 'ERROR',
    internalMessage: 'Source unavailable',
    message: 'The data source is not responding. Please try again later.',
  },
} as const satisfies Record<string, { severity: Severity; internalMessage: string; message: string }>;

export type ErrorCode = keyof typeof ERRORS;

interface MuFundsErrorOptions {
  /** Replaces the code's default internal message. Logged, never shown to the user. */
  internalMessage?: string;
  cause?: unknown;
}

/** An error whose message is safe to show to the user. */
export class MuFundsError extends Error {
  override name = 'MuFundsError';
  readonly code: ErrorCode;
  readonly severity: Severity;
  readonly internalMessage: string;

  constructor(code: ErrorCode, { internalMessage, cause }: MuFundsErrorOptions = {}) {
    const defaults = ERRORS[code];
    super(defaults.message);
    this.code = code;
    this.severity = defaults.severity;
    this.internalMessage = internalMessage ?? defaults.internalMessage;
    // Set by hand: the `cause` option of the Error constructor is too recent to rely on.
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/** Returns `error` if it's a `MuFundsError`, or wraps it as `SOURCE_UNAVAILABLE`. */
export function toMuFundsError(error: unknown): MuFundsError {
  if (error instanceof MuFundsError) {
    return error;
  }
  return new MuFundsError('SOURCE_UNAVAILABLE', {
    internalMessage: describeError(error),
    cause: error,
  });
}

/** A one-line description of any thrown value, for logs. */
export function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/** A data source answered with a non-2xx status. Internal: reaches users as `SOURCE_UNAVAILABLE`. */
export class HttpError extends Error {
  override name = 'HttpError';
  readonly url: string;
  readonly status: number;

  constructor(url: string, status: number) {
    super(`${status} from ${url}`);
    this.url = url;
    this.status = status;
  }
}
