// Hits quefondos.com for real. Expectations can drift as upstream data changes.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getAssetValue } from '../../src/index.ts';
import { liveServices, type Option } from './live-services.ts';

interface Asset {
  name: string;
  id: string;
  available: Option[];
  unavailable: Option[];
}

const ASSETS: Asset[] = [
  {
    name: 'UCITS mutual fund',
    id: 'IE00B03HD191',
    available: [
      'nav',
      'date',
      'currency',
      'category',
      'change',
      'return1d',
      'return1m',
      'return3m',
      'return1y',
      'return3y',
      'return5y',
      'returnytd',
    ],
    unavailable: ['expenses'],
  },
  {
    name: 'Spanish pension plan',
    id: 'N5396',
    // Not checked: return5y, which appears once the plan is five years old.
    available: ['nav', 'date', 'currency', 'category', 'return1m', 'return3m', 'return1y', 'return3y', 'returnytd'],
    unavailable: ['expenses', 'change', 'return1d'],
  },
];

const services = liveServices();

for (const asset of ASSETS) {
  describe(`quefondos: ${asset.name} (${asset.id})`, () => {
    for (const option of asset.available) {
      it(`returns ${option}`, () => {
        const value = getAssetValue(option, asset.id, 'quefondos', services);

        if (option === 'currency') assert.equal(value, 'EUR');
        else if (option === 'category') assert.equal(value, 'RVI GLOBAL');
        else if (option === 'date') assert.match(String(value), /^\d{2}\/\d{2}\/\d{4}$/);
        else if (option === 'nav') assert.ok(Number(value) > 0);
        else assert.ok(Number.isFinite(value));
      });
    }

    for (const option of asset.unavailable) {
      it(`has no ${option}`, () => {
        assert.throws(() => getAssetValue(option, asset.id, 'quefondos', services), {
          code: 'DATA_NOT_AVAILABLE',
        });
      });
    }
  });
}

it(`quefondos: doesn't find an unknown id`, () => {
  assert.throws(() => getAssetValue('nav', 'XX0000000000', 'quefondos', services), {
    code: 'ASSET_NOT_FOUND',
  });
});
