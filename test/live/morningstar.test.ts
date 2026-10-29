// Hits Morningstar for real. Expectations can drift as upstream data changes.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getAssetValue } from '../../src/index.ts';
import { liveServices, OPTIONS, RETURN_OPTIONS, type Option } from './live-services.ts';

interface Asset {
  name: string;
  /** Different identifiers for the same asset. They must all return the same values. */
  ids: string[];
  currency: string;
  category: string;
  /** Options Morningstar has no data for. */
  unavailable?: Option[];
}

const ASSETS: Asset[] = [
  {
    name: 'UCITS mutual fund (USD)',
    ids: ['0P0000V0SF'],
    currency: 'USD',
    category: 'Sector Equity Technology',
  },
  {
    name: 'UCITS mutual fund (EUR)',
    ids: ['IE00B03HD191', '0P00000WLG'],
    currency: 'EUR',
    category: 'Global Large-Cap Blend Equity',
  },
  {
    name: 'UCITS ETF',
    ids: ['0P0001BVGE'],
    currency: 'EUR',
    category: 'Europe ex-UK Equity',
    unavailable: ['expenses'],
  },
  {
    name: 'UK mutual fund',
    ids: ['GB00B7QK1Y37', 'F00000OJRV'],
    currency: 'GBP',
    category: 'US Large-Cap Blend Equity',
    unavailable: ['expenses'],
  },
  {
    name: 'UK pension fund',
    ids: ['GB00B2PGGQ45', '0P0000F3DY'],
    currency: 'GBP',
    category: 'Japan Large-Cap Blend Equity',
  },
  {
    name: 'Spanish pension plan',
    ids: ['N5396', 'F000016CB6'],
    currency: 'EUR',
    category: 'Global Equity PP',
    unavailable: ['expenses'],
  },
  {
    name: 'Canadian mutual fund',
    ids: ['EDG180', '0P0000IUYM'],
    currency: 'CAD',
    category: 'Global Equity Balanced',
    unavailable: ['expenses'],
  },
  {
    name: 'Australian mutual fund',
    ids: ['AU60MMF15632', 'MMF1563AU', '18568', 'F00000LKY3'],
    currency: 'AUD',
    category: 'Equity World Large Growth',
    unavailable: ['expenses', 'change', ...RETURN_OPTIONS],
  },
  {
    name: 'US mutual fund',
    ids: ['US9229087104', 'VFIAX', '922908710', 'FOUSA00L8W'],
    currency: 'USD',
    category: 'Large Blend',
  },
  {
    name: 'Chinese mutual fund',
    ids: ['017305', 'F00001ESHW'],
    currency: 'CNY',
    category: 'Short-Term Bond',
    unavailable: ['return5y'],
  },
  {
    name: 'Singaporean mutual fund',
    ids: ['SG9999002794', '0P00006Q06'],
    currency: 'SGD',
    category: 'Sector Equity Technology',
  },
  {
    name: 'Indonesian mutual fund',
    ids: ['IDN000016706', 'F000003YB6'],
    currency: 'IDR',
    category: 'Indonesia Equity',
    unavailable: ['expenses'],
  },
  {
    name: 'Thai mutual fund',
    ids: ['THA792010003', '0P0001PAL0'],
    currency: 'THB',
    category: 'Foreign Investment Miscellaneous',
    unavailable: ['return5y'],
  },
  {
    name: 'Brazilian mutual fund',
    ids: ['BR018ZCTF006', 'F000013FB3'],
    currency: 'BRL',
    category: 'BRL Corporate Bond',
  },
  {
    name: 'Chilean mutual fund',
    ids: ['CL0001523589', 'F00000ZUTU'],
    currency: 'CLP',
    category: 'Moderate Allocation',
    unavailable: ['expenses'],
  },
  {
    name: 'Mexican mutual fund',
    ids: ['MX52GO090015', 'F00000LVWX'],
    currency: 'MXN',
    category: 'MXN Aggressive Allocation',
  },
  {
    name: 'Israeli mutual fund',
    ids: ['IL0051252166', 'F00000ZRCT'],
    currency: 'ILS',
    category: 'ILS Cautious Allocation, 10% Equity Cap',
    unavailable: ['expenses'],
  },
  {
    name: 'Hong Kong mutual fund',
    ids: ['HK0000061553', '0P0001SKSP'],
    currency: 'HKD',
    category: 'Asia ex-Japan Equity',
  },
  {
    name: 'Taiwanese mutual fund',
    ids: ['TW000T1819A9', '0P0001LF7Y'],
    currency: 'TWD',
    category: 'US Large-Cap Growth Equity',
  },
  {
    name: 'Malaysian mutual fund',
    ids: ['MYU00007AA09', '0P00008MH7'],
    currency: 'MYR',
    category: 'Money Market - Malaysia',
  },
];

const services = liveServices();

for (const asset of ASSETS) {
  describe(`Morningstar: ${asset.name}`, () => {
    const firstValues = new Map<Option, string | number>();

    for (const id of asset.ids) {
      for (const option of OPTIONS) {
        if (asset.unavailable?.includes(option)) {
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
          else if (option === 'category') assert.equal(value, asset.category);
          else if (option === 'date') assert.match(String(value), /^\d{4}-\d{2}-\d{2}$/);
          else if (option === 'nav' || option === 'expenses') assert.ok(Number(value) > 0);
          else assert.ok(Number.isFinite(value));

          const first = firstValues.get(option);
          if (first === undefined) firstValues.set(option, value);
          else assert.equal(value, first, `differs from ${asset.ids[0]}`);
        });
      }
    }
  });
}
