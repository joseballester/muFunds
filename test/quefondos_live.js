const assert = require('assert');

const newTestContext = require('./mocks');

describe('[quefondos_live] UCITS mutual fund (IE00B03HD191)', () => {
  const id = 'IE00B03HD191';
  const source = 'quefondos';

  const testContext = newTestContext();

  it('should return NAV', () => {
    const nav = testContext.muFunds('nav', id, source);
    assert.ok(!isNaN(nav));
    assert.ok(nav > 0);
  });

  it('should return date', () => {
    const date = testContext.muFunds('date', id, source);
    assert.match(date, /^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('should return currency', () => {
    const currency = testContext.muFunds('currency', id, source);
    assert.equal(currency, 'EUR');
  });

  it('should return category', () => {
    const category = testContext.muFunds('category', id, source);
    assert.equal(category, 'RVI GLOBAL');
  });

  ['change', 'return1d', 'return1m', 'return3m', 'return1y', 'return3y', 'return5y', 'returnytd'].forEach((option) => {
    it(`should return ${option}`, () => {
      const value = testContext.muFunds(option, id, source);
      assert.ok(!isNaN(value));
    });
  });


  it('should throw an error for expenses', () => {
    try {
      testContext.muFunds('expenses', id, source);
      assert.fail('Expected error was not thrown');
    } catch (error) {
      assert.equal(error.message, 'Requested data is not available for this asset from this data source. Please try a different source.');
    }
  });
});

describe('[quefondos_live] Spanish pension plan (N5396)', () => {
  const id = 'N5396';
  const source = 'quefondos';

  const testContext = newTestContext();

  it('should return NAV', () => {
    const nav = testContext.muFunds('nav', id, source);
    assert.ok(!isNaN(nav));
    assert.ok(nav > 0);
  });

  it('should return date', () => {
    const date = testContext.muFunds('date', id, source);
    assert.match(date, /^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('should return currency', () => {
    const currency = testContext.muFunds('currency', id, source);
    assert.equal(currency, 'EUR');
  });

  it('should return category', () => {
    const category = testContext.muFunds('category', id, source);
    assert.equal(category, 'RVI GLOBAL');
  });

  ['return1m', 'return3m', 'return1y', 'return3y', 'returnytd'].forEach((option) => {
    it(`should return ${option}`, () => {
      const value = testContext.muFunds(option, id, source);
      assert.ok(!isNaN(value));
    });
  });

  ['expenses', 'change', 'return1d'].forEach((option) => {
    it(`should throw an error for ${option}`, () => {
      try {
        testContext.muFunds(option, id, source);
        assert.fail('Expected error was not thrown');
      } catch (error) {
        assert.equal(error.message, 'Requested data is not available for this asset from this data source. Please try a different source.');
      }
    });
  });
});
