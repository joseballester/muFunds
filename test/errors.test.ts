import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ERRORS, MuFundsError, toMuFundsError } from '../src/errors.ts';

describe('MuFundsError', () => {
  it('takes its messages and severity from the code', () => {
    const error = new MuFundsError('ASSET_NOT_FOUND');

    assert.equal(error.code, 'ASSET_NOT_FOUND');
    assert.equal(error.message, ERRORS.ASSET_NOT_FOUND.message);
    assert.equal(error.severity, 'INFO');
    assert.equal(error.internalMessage, 'Asset not found');
    assert.equal(error.cause, undefined);
  });

  it('keeps an internal message and a cause', () => {
    const cause = new Error('boom');
    const error = new MuFundsError('SOURCE_UNAVAILABLE', {
      internalMessage: 'details',
      cause,
    });

    assert.equal(error.message, ERRORS.SOURCE_UNAVAILABLE.message);
    assert.equal(error.severity, 'ERROR');
    assert.equal(error.internalMessage, 'details');
    assert.equal(error.cause, cause);
  });
});

describe('toMuFundsError', () => {
  it('returns muFunds errors unchanged', () => {
    const error = new MuFundsError('EMPTY_ID');
    assert.equal(toMuFundsError(error), error);
  });

  it('wraps anything else as SOURCE_UNAVAILABLE', () => {
    const cause = new SyntaxError('Unexpected token < in JSON');
    const error = toMuFundsError(cause);

    assert.equal(error.code, 'SOURCE_UNAVAILABLE');
    assert.equal(error.internalMessage, 'SyntaxError: Unexpected token < in JSON');
    assert.equal(error.cause, cause);
    assert.equal(toMuFundsError('oops').internalMessage, 'oops');
  });
});
