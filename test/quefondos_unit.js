const assert = require('assert');
const newTestContext = require('./mocks');

const UrlFetchAppFromFile = require('./mocks/UrlFetchApp_file');

describe('[quefondos] Unit tests', () => {
  const id = 'IE00B03HD191';
  const source = 'quefondos';

  const testContext = newTestContext({
    UrlFetchApp: UrlFetchAppFromFile,
  });

  it('should return NAV', () => {
    const nav = testContext.muFunds('nav', id, source);
    assert.equal(nav, 52.3934);
  });

  it('should return date', () => {
    const date = testContext.muFunds('date', id, source);
    assert.equal(date, '08/09/2025');
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
