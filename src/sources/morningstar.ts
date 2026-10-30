import { describeError, MuFundsError } from '../errors.ts';
import { fetchJson } from '../http.ts';
import { fromPercent } from '../parse.ts';
import type { AssetData, Services } from '../types.ts';

const SCREENER_URL = 'https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener';
const QUOTE_API_URL = 'https://global.morningstar.com/api/v1/en-gb/stores/realtime/quotes';

/** The screener converts prices to this currency unless told otherwise. */
const DEFAULT_CURRENCY = 'EUR';

/** A screener result. Prices are in `PriceCurrency`; ratios and returns are percentages. */
interface ScreenerRow {
  CategoryName?: string;
  ClosePrice?: number;
  ClosePriceDate?: string;
  ExpenseRatio?: number;
  PriceCurrency?: string;
  GBRReturnD1?: number;
  GBRReturnM0?: number; // Year to date
  GBRReturnM1?: number;
  GBRReturnM3?: number;
  GBRReturnM12?: number;
  GBRReturnM36?: number; // Annualized
  GBRReturnM60?: number; // Annualized
  SecId?: string;
  PerformanceId?: string;
  Isin?: string;
  Valoren?: string;
  Wkn?: string;
  Sedol?: string;
  Mex?: string;
  DgsCode?: string;
  Ticker?: string;
  Apir?: string;
}

/** Screener columns an `id` can match. Used to pick a row when a search returns several. */
const ID_COLUMNS = [
  'SecId',
  'PerformanceId',
  'Isin',
  'Valoren', // Swiss identifier
  'Wkn', // German identifier
  'Sedol', // London Stock Exchange identifier
  'Mex', // Financial Times code for investment funds
  'DgsCode', // Spanish pension plan code
  'Ticker',
  'Apir', // Australian fund code
] as const satisfies readonly (keyof ScreenerRow)[];

const DATA_POINTS = [
  'CategoryName',
  'ClosePrice',
  'ClosePriceDate',
  'ExpenseRatio',
  'Name',
  'PriceCurrency',
  'GBRReturnD1',
  'GBRReturnM0',
  'GBRReturnM1',
  'GBRReturnM3',
  'GBRReturnM12',
  'GBRReturnM36',
  'GBRReturnM60',
  ...ID_COLUMNS,
  // Not read, but kept in the request in case the screener's term search uses them.
  'Universe',
  'IsinMkt',
  'IsinMic',
  'TenforeId',
  'Custom',
  'CustomInstitutionSecurityId',
];

const UNIVERSES = [
  'FOALL$$ALL', // All open-ended funds
  'ETALL$$ALL', // All ETFs
  'E0WWE$$ALL', // All stocks
  // Not included in the "all" universes above
  'FOFRA$$FXP', // French innovation and local investment funds (FCPI, FIP)
  'SAGBR$$ALL', // UK pension funds
  'FCIND$$ALL', // Indian closed-end funds
  'CEEXG$XLON', // LSE investment trusts
];

interface ScreenerResponse {
  rows?: ScreenerRow[];
}

type QuoteApiResponse = Record<
  string,
  {
    lastPrice?: {
      value?: number;
      date?: { value?: string };
      currency?: { value?: string };
    };
    percentNetChange?: { value?: number };
  }
>;

/**
 * Looks the asset up in Morningstar's screener. If the screener request fails,
 * falls back to the quote API, which only has the price, date, currency and daily change.
 */
export function loadFromMorningstar(id: string, services: Services): AssetData {
  let row: ScreenerRow;
  try {
    row = findRow(fetchScreener(services, id, DEFAULT_CURRENCY), id);
  } catch (screenerError) {
    if (screenerError instanceof MuFundsError) {
      throw screenerError;
    }
    try {
      return loadFromQuoteApi(id, services);
    } catch (quoteError) {
      if (quoteError instanceof MuFundsError) {
        throw quoteError;
      }
      throw new MuFundsError('SOURCE_UNAVAILABLE', {
        internalMessage: `Screener: ${describeError(screenerError)}. Quote API: ${describeError(quoteError)}`,
        cause: quoteError,
      });
    }
  }

  // Prices and returns come converted to the requested currency, so ask again in the asset's own.
  if (row.PriceCurrency && row.PriceCurrency !== DEFAULT_CURRENCY) {
    row = findRow(fetchScreener(services, id, row.PriceCurrency), id);
  }

  return {
    ...toNativeUnits(row.ClosePrice, row.PriceCurrency),
    date: row.ClosePriceDate,
    expenses: fromPercent(row.ExpenseRatio),
    category: row.CategoryName,
    return1d: fromPercent(row.GBRReturnD1),
    return1m: fromPercent(row.GBRReturnM1),
    return3m: fromPercent(row.GBRReturnM3),
    return1y: fromPercent(row.GBRReturnM12),
    return3y: fromPercent(row.GBRReturnM36),
    return5y: fromPercent(row.GBRReturnM60),
    returnytd: fromPercent(row.GBRReturnM0),
  };
}

function loadFromQuoteApi(id: string, services: Services): AssetData {
  const response = fetchJson<QuoteApiResponse>(services, `${QUOTE_API_URL}?securities=${encodeURIComponent(id)}`);

  const quote = response[id];
  if (!quote) {
    throw new MuFundsError('ASSET_NOT_FOUND', {
      internalMessage: 'Asset not found in quote API',
    });
  }

  return {
    ...toNativeUnits(quote.lastPrice?.value, quote.lastPrice?.currency?.value),
    date: quote.lastPrice?.date?.value?.substring(0, 10),
    return1d: fromPercent(quote.percentNetChange?.value),
  };
}

function fetchScreener(services: Services, term: string, currency: string): ScreenerResponse {
  const params: Record<string, string | number | string[]> = {
    outputType: 'json',
    page: 1,
    pageSize: 10,
    currencyId: currency,
    securityDataPoints: DATA_POINTS,
    term,
    universeIds: UNIVERSES,
    version: 1,
  };

  // Apps Script has no URLSearchParams. List items are joined with an encoded "|".
  const query = Object.entries(params)
    .map(([key, value]) => {
      const encoded = Array.isArray(value) ? value.join('%7C') : encodeURIComponent(value);
      return `${key}=${encoded}`;
    })
    .join('&');

  return fetchJson<ScreenerResponse>(services, `${SCREENER_URL}?${query}`);
}

/** Picks the row for `id`. A search can match several rows, e.g. similar funds or listings. */
function findRow(response: ScreenerResponse, id: string): ScreenerRow {
  const rows = response.rows ?? [];

  if (rows.length === 0) {
    throw new MuFundsError('ASSET_NOT_FOUND', {
      internalMessage: 'Asset not found in screener',
    });
  }
  if (rows.length === 1) {
    return rows[0]!;
  }

  const exactMatches = rows.filter((row) => ID_COLUMNS.some((column) => row[column] === id));
  if (exactMatches.length === 1) {
    return exactMatches[0]!;
  }

  const secIds = rows.map((row) => row.SecId ?? '?').join(', ');
  throw new MuFundsError('AMBIGUOUS_ID', {
    internalMessage: `${rows.length} screener results, ${exactMatches.length} exact: ${secIds}`,
  });
}

/** UK prices are often quoted in pence (GBX). Converts them to pounds. */
function toNativeUnits(price: number | undefined, currency: string | undefined): Pick<AssetData, 'nav' | 'currency'> {
  if (currency === 'GBX') {
    return {
      nav: price === undefined ? undefined : price / 100,
      currency: 'GBP',
    };
  }
  return { nav: price, currency };
}
