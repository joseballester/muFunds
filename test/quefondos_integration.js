const assert = require('assert');
const newTestContext = require('./mocks');

const UrlFetchAppFromFetch = require('./mocks/UrlFetchApp_fetch');

describe('[quefondos] Integration tests', () => {
  const id = 'IE00B03HD191';
  const source = 'quefondos';

  const testContext = newTestContext({
    UrlFetchApp: UrlFetchAppFromFetch,
  });

  it('should return NAV', () => {
    const nav = testContext.muFunds('nav', id, source);
    assert.ok(!isNaN(nav));
    assert.ok(nav > 0);
  });

  it('should return date', () => {
    const date = testContext.muFunds('date', id, source);
    assert.match(date, /^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('should throw an error for change', () => {
    try {
      testContext.muFunds('change', id, source);
    } catch (error) {
      assert.equal(error.message, 'Last change is not available from this source');
    }
  });

  it('should return currency', () => {
    const currency = testContext.muFunds('currency', id, source);
    assert.equal(currency, 'EUR');
  });

  it('should throw an error for expenses', () => {
    try {
      testContext.muFunds('expenses', id, source);
    } catch (error) {
      assert.equal(error.message, 'Expenses ratio is not available from this source');
    }
  });

  it('should return category', () => {
    const category = testContext.muFunds('category', id, source);
    assert.equal(category, 'RVI GLOBAL');
  });
});
