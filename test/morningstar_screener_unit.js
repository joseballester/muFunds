const assert = require('assert');
const newTestContext = require('./mocks');

const UrlFetchAppFromFile = require('./mocks/UrlFetchApp_file');

describe('[morningstar] Unit tests', () => {
  const id = 'IE00B03HD191';
  const source = 'morningstar';

  const testContext = newTestContext({
    UrlFetchApp: UrlFetchAppFromFile,
  });

  it('should return NAV', () => {
    const nav = testContext.muFunds('nav', id, source);
    assert.equal(nav, 52.5631);
  });

  it('should return date', () => {
    const date = testContext.muFunds('date', id, source);
    assert.equal(date, '2025-09-09');
  });

  it('should return change', () => {
    const change = testContext.muFunds('change', id, source);
    assert(change, 0.0017000000000000001);
  });

  it('should return currency', () => {
    const currency = testContext.muFunds('currency', id, source);
    assert.equal(currency, 'EUR');
  });

  it('should return expenses', () => {
    const expenses = testContext.muFunds('expenses', id, source);
    assert.equal(expenses, 0.0018);
  });

  it('should return category', () => {
    const category = testContext.muFunds('category', id, source);
    assert.equal(category, 'Global Large-Cap Blend Equity');
  });
});
