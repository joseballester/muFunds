const assert = require('assert');

const newTestContext = require('./mocks');

describe('[morningstar_live] UCITS mutual fund (IE00B03HD191)', () => {
  const id = 'IE00B03HD191';
  const source = 'morningstar';

  const testContext = newTestContext();

  it('should return NAV', () => {
    const nav = testContext.muFunds('nav', id, source);
    assert.ok(!isNaN(nav));
    assert.ok(nav > 0);
  });

  it('should return date', () => {
    const date = testContext.muFunds('date', id, source);
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return currency', () => {
    const currency = testContext.muFunds('currency', id, source);
    assert.equal(currency, 'EUR');
  });

  it('should return expenses', () => {
    const expenses = testContext.muFunds('expenses', id, source);
    assert.ok(!isNaN(expenses));
    assert.ok(expenses > 0);
  });

  it('should return category', () => {
    const category = testContext.muFunds('category', id, source);
    assert.equal(category, 'Global Large-Cap Blend Equity');
  });

  ['change', 'return1d', 'return1m', 'return3m', 'return1y', 'return3y', 'return5y', 'returnytd'].forEach((option) => {
    it(`should return ${option}`, () => {
      const value = testContext.muFunds(option, id, source);
      assert.ok(!isNaN(value));
    });
  });
});
