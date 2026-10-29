import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { ERRORS } from '../src/errors.ts';
import { getAssetValue, muFunds } from '../src/index.ts';
import { fakeServices } from './helpers.ts';

const noRequests = () => fakeServices(() => assert.fail('Expected no requests'));

describe('getAssetValue', () => {
  it('rejects an unknown option', () => {
    assert.throws(() => getAssetValue('unknown_option', 'asset_id', undefined, noRequests()), {
      code: 'UNKNOWN_OPTION',
    });
  });

  it('rejects an empty id', () => {
    for (const id of ['', '   ', undefined, null]) {
      assert.throws(() => getAssetValue('nav', id, undefined, noRequests()), {
        code: 'EMPTY_ID',
      });
    }
  });

  it('rejects an unknown source', () => {
    for (const source of ['unknown_source', 'constructor', 'morningstar-xx']) {
      assert.throws(() => getAssetValue('nav', 'asset_id', source, noRequests()), {
        code: 'UNKNOWN_SOURCE',
      });
    }
  });

  it('accepts options and sources in any case, with surrounding spaces', () => {
    const services = fakeServices(() => '<html></html>');
    // Reaching the source means validation passed; the empty page is "not found".
    assert.throws(() => getAssetValue(' NAV ', 'N5396', 'QueFondos ', services), {
      code: 'ASSET_NOT_FOUND',
    });
    assert.equal(services.requests.length, 1);
  });

  it('uses Morningstar by default and for legacy country-specific names', () => {
    for (const source of [undefined, null, '', 'morningstar', 'morningstar-es', 'morningstar-uk']) {
      const services = fakeServices(() => JSON.stringify({ rows: [{ ClosePrice: 10 }] }));
      assert.equal(getAssetValue('nav', 'asset_id', source, services), 10);
      assert.match(services.requests[0]!, /^https:\/\/lt\.morningstar\.com\//);
    }
  });

  it('accepts numeric ids', () => {
    const services = fakeServices(() => JSON.stringify({ rows: [{ ClosePrice: 10 }] }));
    assert.equal(getAssetValue('nav', 18568, undefined, services), 10);
    assert.match(services.requests[0]!, /&term=18568&/);
  });

  it('wraps unexpected source errors as SOURCE_UNAVAILABLE', () => {
    const services = fakeServices(() => ({
      status: 503,
      body: 'Service Unavailable',
    }));
    assert.throws(() => getAssetValue('nav', 'asset_id', undefined, services), {
      code: 'SOURCE_UNAVAILABLE',
      message: ERRORS.SOURCE_UNAVAILABLE.message,
    });
  });

  it('reports a missing value as not available', () => {
    const services = fakeServices(() => JSON.stringify({ rows: [{ ClosePrice: 10 }] }));
    assert.throws(() => getAssetValue('category', 'asset_id', undefined, services), {
      code: 'DATA_NOT_AVAILABLE',
    });
  });
});

describe('getAssetValue cache', () => {
  const screenerRow = JSON.stringify({ rows: [{ ClosePrice: 10, CategoryName: 'Equity' }] });

  it('serves every option of an asset from one lookup', () => {
    const services = fakeServices(() => screenerRow);

    assert.equal(getAssetValue('nav', 'asset_id', undefined, services), 10);
    assert.equal(getAssetValue('category', 'asset_id', undefined, services), 'Equity');
    assert.throws(() => getAssetValue('expenses', 'asset_id', undefined, services), {
      code: 'DATA_NOT_AVAILABLE',
    });

    assert.equal(services.requests.length, 1);
    assert.deepEqual([...services.cache.entries.keys()], ['v1:morningstar:asset_id']);
    assert.equal(services.cache.entries.get('v1:morningstar:asset_id')!.expirationInSeconds, 2 * 60 * 60);
  });

  it('shares entries between names of the same source', () => {
    const services = fakeServices(() => screenerRow);

    getAssetValue('nav', 'asset_id', 'morningstar-es', services);
    getAssetValue('nav', 'asset_id', ' Morningstar ', services);
    getAssetValue('nav', 'asset_id', undefined, services);

    assert.equal(services.requests.length, 1);
  });

  it('keeps assets and sources apart', () => {
    const services = fakeServices(() => '<html></html>');

    assert.throws(() => getAssetValue('nav', 'N5396', 'quefondos', services), { code: 'ASSET_NOT_FOUND' });
    services.cache.put('v1:morningstar:N5396', JSON.stringify({ nav: 1 }), 60);
    services.cache.put('v1:quefondos:other_id', JSON.stringify({ nav: 2 }), 60);
    assert.throws(() => getAssetValue('nav', 'N5396', 'quefondos', services), { code: 'ASSET_NOT_FOUND' });

    assert.equal(services.requests.length, 2);
  });

  it('doesn’t cache errors, so the next lookup asks again', () => {
    const responses = [
      { status: 503, body: '' }, // Screener
      { status: 503, body: '' }, // Quote API fallback
      JSON.stringify({ rows: [] }),
      screenerRow,
    ];
    const services = fakeServices(() => responses.shift() ?? assert.fail('Too many requests'));

    assert.throws(() => getAssetValue('nav', 'asset_id', undefined, services), { code: 'SOURCE_UNAVAILABLE' });
    assert.throws(() => getAssetValue('nav', 'asset_id', undefined, services), { code: 'ASSET_NOT_FOUND' });
    assert.equal(services.cache.entries.size, 0);
    assert.equal(getAssetValue('nav', 'asset_id', undefined, services), 10);
    assert.equal(getAssetValue('nav', 'asset_id', undefined, services), 10);

    assert.equal(services.requests.length, 4);
  });
});

describe('muFunds', () => {
  // Stand-ins for the Apps Script globals, which Node doesn't have.
  const scope = globalThis as { Logger?: unknown; UrlFetchApp?: unknown };
  const logged: { level: 'log' | 'severe'; entry: LogEntry }[] = [];

  beforeEach(() => {
    logged.length = 0;
    scope.Logger = {
      log: (entry: LogEntry) => logged.push({ level: 'log', entry }),
      severe: (entry: LogEntry) => logged.push({ level: 'severe', entry }),
    };
    scope.UrlFetchApp = {
      fetch: () => {
        throw new Error('DNS error: www.quefondos.com');
      },
    };
  });

  afterEach(() => {
    delete scope.Logger;
    delete scope.UrlFetchApp;
  });

  it('logs expected errors at INFO with Logger.log', () => {
    assert.throws(() => muFunds('unknown_option', 'asset_id', 'quefondos'), {
      message: ERRORS.UNKNOWN_OPTION.message,
    });

    assert.equal(logged.length, 1);
    const { level, entry } = logged[0]!;
    assert.equal(level, 'log');
    assert.deepEqual(entry, {
      errorCode: 'UNKNOWN_OPTION',
      message: 'Unknown option',
      userMessage: ERRORS.UNKNOWN_OPTION.message,
      context: {
        option: 'unknown_option',
        id: 'asset_id',
        source: 'quefondos',
        stack: entry.context.stack,
      },
    });
  });

  it('shows unexpected errors as SOURCE_UNAVAILABLE and logs the original at ERROR', () => {
    assert.throws(() => muFunds('nav', 'N5396', 'quefondos'), {
      message: ERRORS.SOURCE_UNAVAILABLE.message,
    });

    assert.equal(logged.length, 1);
    const { level, entry } = logged[0]!;
    assert.equal(level, 'severe');
    assert.equal(entry.errorCode, 'SOURCE_UNAVAILABLE');
    assert.equal('severity' in entry, false);
    assert.equal(entry.message, 'Error: DNS error: www.quefondos.com');
    assert.equal(entry.userMessage, ERRORS.SOURCE_UNAVAILABLE.message);
    // The stack of the original error, not of the wrapper.
    assert.match(entry.context.stack ?? '', /^Error: DNS error/);
  });

  it('shows the daily UrlFetch quota as QUOTA_EXCEEDED, logs it at INFO and skips the fallback', () => {
    let fetches = 0;
    scope.UrlFetchApp = {
      fetch: () => {
        fetches++;
        throw new Error('Service invoked too many times for one day: urlfetch.');
      },
    };

    assert.throws(() => muFunds('nav', 'IE00B03HD191', undefined), {
      message: ERRORS.QUOTA_EXCEEDED.message,
    });

    // The Morningstar quote API fallback would hit the same quota, so it isn't tried.
    assert.equal(fetches, 1);
    assert.equal(logged.length, 1);
    const { level, entry } = logged[0]!;
    assert.equal(level, 'log');
    assert.equal(entry.errorCode, 'QUOTA_EXCEEDED');
    assert.equal(entry.message, 'Error: Service invoked too many times for one day: urlfetch.');
    assert.equal(entry.userMessage, ERRORS.QUOTA_EXCEEDED.message);
  });
});

interface LogEntry {
  errorCode: string;
  message: string;
  userMessage: string;
  context: { stack?: string };
}
