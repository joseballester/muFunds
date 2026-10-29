import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { appsScriptServices, isUrlFetchQuotaError } from '../src/apps-script.ts';

describe('isUrlFetchQuotaError', () => {
  it('matches the daily quota error in any language', () => {
    for (const message of [
      'Service invoked too many times for one day: urlfetch.',
      'Se ha invocado el servicio demasiadas veces en un día: urlfetch.',
      'Service invoked too many times for one day: urlfetch',
    ]) {
      assert.equal(isUrlFetchQuotaError(new Error(message)), true, message);
    }
  });

  it('ignores other UrlFetch errors', () => {
    for (const message of [
      'Address unavailable: https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener',
      'DNS error: www.quefondos.com',
      'Bandwidth quota exceeded: https://www.quefondos.com/es/fondos/ficha/index.html?isin=X',
      'Service invoked too many times in a short time: urlfetch. Try Utilities.sleep(1000) between calls.',
      'Service invoked too many times for one day: email.',
    ]) {
      assert.equal(isUrlFetchQuotaError(new Error(message)), false, message);
    }
    assert.equal(isUrlFetchQuotaError('Service invoked too many times for one day: urlfetch.'), false);
  });
});

describe('appsScriptServices', () => {
  const scope = globalThis as { UrlFetchApp?: unknown; CacheService?: unknown };

  afterEach(() => {
    delete scope.UrlFetchApp;
    delete scope.CacheService;
  });

  const failWith = (message: string) => {
    scope.UrlFetchApp = {
      fetch: () => {
        throw new Error(message);
      },
    };
  };

  it('turns the daily quota error into QUOTA_EXCEEDED', () => {
    failWith('Service invoked too many times for one day: urlfetch.');

    assert.throws(() => appsScriptServices().fetch('https://example.com'), {
      name: 'MuFundsError',
      code: 'QUOTA_EXCEEDED',
      internalMessage: 'Error: Service invoked too many times for one day: urlfetch.',
    });
  });

  it('caches in the script cache', () => {
    const stored = new Map<string, { value: string; seconds: number }>();
    scope.CacheService = {
      getScriptCache: () => ({
        get: (key: string) => stored.get(key)?.value ?? null,
        put: (key: string, value: string, seconds: number) => stored.set(key, { value, seconds }),
      }),
    };
    const { cache } = appsScriptServices();

    assert.equal(cache.get('key'), null);
    cache.put('key', 'value', 60);
    assert.equal(cache.get('key'), 'value');
    assert.deepEqual(stored.get('key'), { value: 'value', seconds: 60 });
  });

  it('treats a cache failure as a miss', () => {
    scope.CacheService = {
      getScriptCache: () => ({
        get: () => {
          throw new Error('Service error: CacheService');
        },
        put: () => {
          throw new Error('Argument too large: value');
        },
      }),
    };
    const { cache } = appsScriptServices();

    assert.equal(cache.get('key'), null);
    assert.doesNotThrow(() => cache.put('key', 'value', 60));
  });

  it('rethrows other errors unchanged', () => {
    failWith('DNS error: example.com');

    assert.throws(() => appsScriptServices().fetch('https://example.com'), {
      name: 'Error',
      message: 'DNS error: example.com',
    });
  });
});
