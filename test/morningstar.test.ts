import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { MuFundsError } from '../src/errors.ts';
import { loadFromMorningstar } from '../src/sources/morningstar.ts';
import { fakeServices, queryParam, readFixture } from './helpers.ts';

const isScreener = (url: string) => url.startsWith('https://lt.morningstar.com/');
const isQuoteApi = (url: string) =>
  url.startsWith('https://global.morningstar.com/api/v1/en-gb/stores/realtime/quotes');

const screener = (...rows: object[]) => JSON.stringify({ total: rows.length, rows });

describe('Morningstar screener', () => {
  it('reads every field with one request', () => {
    // Holds the target fund and a similar UK pension fund, so the row is picked by ISIN.
    const services = fakeServices(() => readFixture('morningstar-screener-IE00B03HD191.json'));

    const data = loadFromMorningstar('IE00B03HD191', services);

    assert.deepEqual(data, {
      nav: 65.6729,
      date: '2026-10-28',
      currency: 'EUR',
      // Morningstar reports percentages; muFunds returns fractions.
      expenses: 0.18 / 100,
      category: 'Global Large-Cap Blend Equity',
      return1d: 0.24 / 100,
      return1m: 2.34 / 100,
      return3m: 5.38 / 100,
      return1y: 18.05 / 100,
      return3y: 21.24 / 100,
      return5y: 11.75 / 100,
      returnytd: 18.61 / 100,
    });
    assert.equal(services.requests.length, 1);
    assert.equal(queryParam(services.requests[0]!, 'term'), 'IE00B03HD191');
    assert.equal(queryParam(services.requests[0]!, 'currencyId'), 'EUR');
  });

  it('asks again in the asset’s own currency', () => {
    const services = fakeServices((url) =>
      queryParam(url, 'currencyId') === 'USD'
        ? screener({ SecId: 'X', ClosePrice: 100, PriceCurrency: 'USD' })
        : screener({ SecId: 'X', ClosePrice: 92, PriceCurrency: 'USD' }),
    );

    const data = loadFromMorningstar('X', services);

    assert.equal(data.nav, 100);
    assert.equal(data.currency, 'USD');
    assert.deepEqual(
      services.requests.map((url) => queryParam(url, 'currencyId')),
      ['EUR', 'USD'],
    );
  });

  it('converts pence (GBX) to pounds', () => {
    const services = fakeServices(() => screener({ SecId: 'X', ClosePrice: 1234, PriceCurrency: 'GBX' }));

    const data = loadFromMorningstar('X', services);

    assert.equal(data.nav, 12.34);
    assert.equal(data.currency, 'GBP');
  });

  it('leaves missing values undefined', () => {
    const services = fakeServices(() => screener({ SecId: 'security_id' }));

    const data = loadFromMorningstar('security_id', services);

    assert.ok(Object.values(data).every((value) => value === undefined));
    assert.equal(services.requests.length, 1);
  });

  it('throws when nothing matches', () => {
    const services = fakeServices(() => screener());

    assert.throws(() => loadFromMorningstar('wrong_id', services), {
      code: 'ASSET_NOT_FOUND',
    });
    assert.equal(services.requests.length, 1);
  });

  it('throws when several rows match and none has the exact id', () => {
    const services = fakeServices(() => screener({ SecId: 'A', Ticker: 'VWRL' }, { SecId: 'B', Ticker: 'VWRL' }));

    assert.throws(() => loadFromMorningstar('VWRL', services), {
      code: 'AMBIGUOUS_ID',
    });
  });
});

describe('Morningstar quote API fallback', () => {
  const quote = {
    '0P00000WLG': {
      lastPrice: {
        value: 65.67,
        date: { value: '2026-10-28T00:00:00.000' },
        currency: { value: 'EUR' },
      },
      percentNetChange: { value: 0.24 },
    },
  };

  it('is used when the screener fails', () => {
    const services = fakeServices((url) => {
      if (isScreener(url)) return { status: 500, body: 'Internal Server Error' };
      if (isQuoteApi(url)) return JSON.stringify(quote);
      return assert.fail(`Unexpected request to ${url}`);
    });

    const data = loadFromMorningstar('0P00000WLG', services);

    assert.deepEqual(data, {
      nav: 65.67,
      date: '2026-10-28',
      currency: 'EUR',
      return1d: 0.0024,
    });
    assert.equal(services.requests.length, 2);
  });

  it('is used when the screener answers with something other than JSON', () => {
    const services = fakeServices((url) => (isScreener(url) ? '<html>Maintenance</html>' : JSON.stringify(quote)));

    assert.equal(loadFromMorningstar('0P00000WLG', services).nav, 65.67);
  });

  it('throws when the quote API doesn’t know the id', () => {
    const services = fakeServices((url) => (isScreener(url) ? { status: 500, body: '' } : JSON.stringify({})));

    assert.throws(() => loadFromMorningstar('wrong_id', services), {
      code: 'ASSET_NOT_FOUND',
    });
  });

  it('reports both failures when the quote API fails too', () => {
    const services = fakeServices((url) => (isScreener(url) ? { status: 500, body: '' } : { status: 502, body: '' }));

    assert.throws(
      () => loadFromMorningstar('0P00000WLG', services),
      (error: MuFundsError) => {
        assert.equal(error.code, 'SOURCE_UNAVAILABLE');
        assert.match(error.internalMessage, /^Screener: HttpError: 500 from https:\/\/lt\./);
        assert.match(error.internalMessage, /\. Quote API: HttpError: 502 from https:\/\/global\./);
        return true;
      },
    );
  });

  it('is not used when the screener finds nothing', () => {
    const services = fakeServices((url) => (isScreener(url) ? screener() : assert.fail('Expected no fallback')));

    assert.throws(() => loadFromMorningstar('wrong_id', services), {
      code: 'ASSET_NOT_FOUND',
    });
  });
});
