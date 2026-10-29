import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { loadFromQuefondos } from '../src/sources/quefondos.ts';
import { fakeServices, readFixture } from './helpers.ts';

describe('quefondos', () => {
  it('reads a mutual fund by ISIN', () => {
    const services = fakeServices(() => readFixture('quefondos-fund-IE00B03HD191.html'));

    const data = loadFromQuefondos('IE00B03HD191', services);

    assert.deepEqual(data, {
      nav: 52.3934,
      date: '08/09/2025',
      currency: 'EUR',
      category: 'RVI GLOBAL',
      return1d: 0.0024,
      return1m: 0.0125,
      return3m: 0.0438,
      return1y: 0.1457,
      return3y: 0.1217,
      return5y: 0.14,
      returnytd: 0.0092,
    });
    assert.deepEqual(services.requests, ['https://www.quefondos.com/es/fondos/ficha/index.html?isin=IE00B03HD191']);
  });

  it('reads a Spanish pension plan by DGS code', () => {
    const services = fakeServices(() => readFixture('quefondos-plan-N5396.html'));

    const data = loadFromQuefondos('N5396', services);

    // Pension plans have no daily change, and this one has no 5-year return yet.
    assert.deepEqual(data, {
      nav: 16.23623,
      date: '05/09/2025',
      currency: 'EUR',
      category: 'RVI GLOBAL',
      return1d: undefined,
      return1m: 0.0096,
      return3m: 0.047,
      return1y: 0.1329,
      return3y: 0.107,
      return5y: undefined,
      returnytd: 0.011399999999999999,
    });
    assert.deepEqual(services.requests, ['https://www.quefondos.com/es/planes/ficha/index.html?isin=N5396']);
  });

  it('reads prices with thousands separators', () => {
    const html = readFixture('quefondos-fund-IE00B03HD191.html').replace('52,393400 EUR', '1.052,393400 EUR');
    const services = fakeServices(() => html);

    assert.equal(loadFromQuefondos('IE00B03HD191', services).nav, 1052.3934);
  });

  it('throws for an unknown id', () => {
    // quefondos answers 200 with an unfilled template.
    const services = fakeServices(() => readFixture('quefondos-not-found.html'));

    assert.throws(() => loadFromQuefondos('XX0000000000', services), {
      code: 'ASSET_NOT_FOUND',
    });
  });

  it('throws for a 404', () => {
    const services = fakeServices(() => ({ status: 404, body: '' }));

    assert.throws(() => loadFromQuefondos('wrong_id', services), {
      code: 'ASSET_NOT_FOUND',
    });
    assert.equal(services.requests.length, 1);
  });

  it('throws an HttpError for a server error', () => {
    const services = fakeServices(() => ({
      status: 500,
      body: 'Internal Server Error',
    }));

    assert.throws(() => loadFromQuefondos('N5396', services), {
      name: 'HttpError',
      status: 500,
    });
  });
});
