import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isMistypedIsin } from '../src/isin.ts';

describe('isMistypedIsin', () => {
  it('accepts valid ISINs, in any case', () => {
    for (const id of [
      'IE00B03HD191',
      'US0378331005',
      'GB00B2PGGQ45',
      'AU60MMF15632',
      'TW000T1819A9',
      'MYU00007AA09',
      'ie00b03hd191',
    ]) {
      assert.equal(isMistypedIsin(id), false, id);
    }
  });

  it('catches a wrong digit or swapped neighbouring digits', () => {
    for (const id of ['IE00B03HD192', 'US0378331006', 'US0378313005', 'IE00B30HD191']) {
      assert.equal(isMistypedIsin(id), true, id);
    }
  });

  it('ignores ids that aren’t shaped like an ISIN', () => {
    // Tickers, SecIds, PerformanceIds, DGS codes, APIR codes, Valoren, and an ISIN missing a character.
    for (const id of ['VWRL', 'F00000LKY3', '0P0000YXJO', 'N5396', 'MMF1563AU', '18568', 'IE00B03HD19']) {
      assert.equal(isMistypedIsin(id), false, id);
    }
  });
});
