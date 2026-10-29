// Hits Morningstar's quote API for real, with the screener made to fail so muFunds falls back.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getAssetValue } from '../../src/index.ts';
import { liveServices, OPTIONS, type Option } from './live-services.ts';

/** The only options the quote API has. */
const QUOTE_OPTIONS: readonly Option[] = ['nav', 'date', 'currency', 'change', 'return1d'];

interface Asset {
  name: string;
  ids: string[];
  /** Undefined when the quote API knows the asset but has no price for it. */
  currency?: string;
  /** Ids the quote API doesn't recognize, like tickers and local codes. */
  notFound?: string[];
}

const ASSETS: Asset[] = [
  {
    name: 'UCITS mutual fund',
    ids: ['IE00B03HD191', '0P00000WLG'],
    currency: 'EUR',
  },
  { name: 'UCITS ETF', ids: ['0P0001BVGE'], currency: 'EUR' },
  {
    name: 'UK mutual fund',
    ids: ['GB00B7QK1Y37', 'F00000OJRV'],
    currency: 'GBP',
  },
  {
    name: 'UK pension fund',
    ids: ['GB00B2PGGQ45', '0P0000F3DY'],
    notFound: ['GB00B2PGGQ45', '0P0000F3DY'],
  },
  {
    name: 'Spanish pension plan',
    ids: ['N5396', 'F000016CB6'],
    currency: 'EUR',
    notFound: ['N5396'],
  },
  {
    name: 'Canadian mutual fund',
    ids: ['EDG180', '0P0000IUYM'],
    currency: 'CAD',
    notFound: ['EDG180'],
  },
  {
    name: 'Australian mutual fund',
    ids: ['AU60MMF15632', 'MMF1563AU', '18568', 'F00000LKY3'],
    notFound: ['MMF1563AU', '18568'],
  },
  {
    name: 'US mutual fund',
    ids: ['US9229087104', 'VFIAX', '922908710', 'FOUSA00L8W'],
    currency: 'USD',
    notFound: ['VFIAX'],
  },
  {
    name: 'Chinese mutual fund',
    ids: ['017305', 'F00001ESHW'],
    currency: 'CNY',
    notFound: ['017305'],
  },
  {
    name: 'Singaporean mutual fund',
    ids: ['SG9999002794', '0P00006Q06'],
    currency: 'SGD',
  },
  {
    name: 'Indonesian mutual fund',
    ids: ['IDN000016706', 'F000003YB6'],
    currency: 'IDR',
  },
  { name: 'Thai mutual fund', ids: ['THA792010003', '0P0001PAL0'] },
  {
    name: 'Brazilian mutual fund',
    ids: ['BR018ZCTF006', 'F000013FB3'],
    currency: 'BRL',
  },
  {
    name: 'Chilean mutual fund',
    ids: ['CL0001523589', 'F00000ZUTU'],
    currency: 'CLP',
  },
  {
    name: 'Mexican mutual fund',
    ids: ['MX52GO090015', 'F00000LVWX'],
    currency: 'MXN',
  },
  {
    name: 'Israeli mutual fund',
    ids: ['IL0051252166', 'F00000ZRCT'],
    currency: 'ILS',
  },
  {
    name: 'Hong Kong mutual fund',
    ids: ['HK0000061553', '0P0001SKSP'],
    currency: 'HKD',
  },
  {
    name: 'Taiwanese mutual fund',
    ids: ['TW000T1819A9', '0P0001LF7Y'],
    currency: 'TWD',
  },
  {
    name: 'Malaysian mutual fund',
    ids: ['MYU00007AA09', '0P00008MH7'],
    currency: 'MYR',
  },
];

const services = liveServices((fetch) => (url) => {
  if (url.startsWith('https://lt.morningstar.com/')) {
    throw new Error('Simulated screener outage');
  }
  return fetch(url);
});

for (const asset of ASSETS) {
  describe(`Morningstar fallback: ${asset.name}`, () => {
    const firstValues = new Map<Option, string | number>();

    for (const id of asset.ids) {
      if (asset.notFound?.includes(id)) {
        it(`doesn't find ${id}`, () => {
          for (const option of OPTIONS) {
            assert.throws(() => getAssetValue(option, id, 'morningstar', services), {
              code: 'ASSET_NOT_FOUND',
            });
          }
        });
        continue;
      }

      for (const option of OPTIONS) {
        if (!asset.currency || !QUOTE_OPTIONS.includes(option)) {
          it(`has no ${option} for ${id}`, () => {
            assert.throws(() => getAssetValue(option, id, 'morningstar', services), {
              code: 'DATA_NOT_AVAILABLE',
            });
          });
          continue;
        }

        it(`returns ${option} for ${id}`, () => {
          const value = getAssetValue(option, id, 'morningstar', services);

          if (option === 'currency') assert.equal(value, asset.currency);
          else if (option === 'date') assert.match(String(value), /^\d{4}-\d{2}-\d{2}$/);
          else if (option === 'nav') assert.ok(Number(value) > 0);
          else assert.ok(Number.isFinite(value));

          const first = firstValues.get(option);
          if (first === undefined) firstValues.set(option, value);
          else assert.equal(value, first, `differs from the first id`);
        });
      }
    }
  });
}
