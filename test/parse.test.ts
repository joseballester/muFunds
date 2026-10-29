import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { annualize, cleanText, parseSpanishNumber, parseSpanishPercent } from '../src/parse.ts';

describe('cleanText', () => {
  it('collapses whitespace', () => {
    assert.equal(cleanText('\n\t RVI \n GLOBAL \t'), 'RVI GLOBAL');
  });

  it('returns undefined for empty or placeholder text', () => {
    assert.equal(cleanText(undefined), undefined);
    assert.equal(cleanText('  \n '), undefined);
    assert.equal(cleanText(' · '), undefined);
  });
});

describe('parseSpanishNumber', () => {
  it('parses decimal commas and thousands separators', () => {
    assert.equal(parseSpanishNumber('52,393400'), 52.3934);
    assert.equal(parseSpanishNumber('1.234,56'), 1234.56);
    assert.equal(parseSpanishNumber('1.000.000,00'), 1_000_000);
    assert.equal(parseSpanishNumber('-12,85'), -12.85);
    assert.equal(parseSpanishNumber('42'), 42);
  });

  it('returns undefined for anything else', () => {
    for (const text of [undefined, '', '·', 'N/A', '1,2,3', '12 EUR']) {
      assert.equal(parseSpanishNumber(text), undefined, `for ${text}`);
    }
  });
});

describe('parseSpanishPercent', () => {
  it('returns a fraction', () => {
    assert.equal(parseSpanishPercent('0,24%'), 0.0024);
    assert.equal(parseSpanishPercent(' -12,85% '), -0.1285);
  });

  it('returns undefined for missing values', () => {
    assert.equal(parseSpanishPercent('·'), undefined);
    assert.equal(parseSpanishPercent(''), undefined);
  });
});

describe('annualize', () => {
  it('converts a cumulative return to an annual one, rounded to 4 decimals', () => {
    assert.equal(annualize(0.4112, 3), 0.1217);
    assert.equal(annualize(0, 5), 0);
    assert.equal(annualize(0.21, 2), 0.1);
  });
});
