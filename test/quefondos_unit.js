const assert = require('assert');
const fs = require('fs');
const sinon = require('sinon');

const newTestContext = require('./mocks');

describe('[quefondos_unit] Asset not found', () => {
  const id = 'wrong_id';
  const source = 'quefondos';

  const fetchStub = sinon.stub();
  fetchStub.returns({
      getResponseCode: () => 404,
      getContentText: () => '',
      getContent: () => '',
    });

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  it('should throw an error', () => {
    try {
      testContext.muFunds('nav', id, source);
      assert.fail('Expected error was not thrown');
    } catch (error) {
      assert.equal(error.message, 'Asset not found. Please use another identifier and/or data source.');
    }
    assert.equal(fetchStub.callCount, 1);
  });
});

describe('[quefondos_unit] Mutual fund', () => {
  const id = 'IE00B03HD191';
  const source = 'quefondos';

  const html = fs.readFileSync(`./test/snapshots/quefondos_${id}.html`, 'utf8');

  const fetchStub = sinon.stub();
  fetchStub.withArgs(`https://www.quefondos.com/es/fondos/ficha/index.html?isin=${id}`)
    .returns({
      getResponseCode: () => 200,
      getContentText: () => html,
      getContent: () => html,
    });

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  it('should return NAV', () => {
    const nav = testContext.muFunds('nav', id, source);
    assert.equal(nav, 52.3934);
    assert.equal(fetchStub.callCount, 1);
  });

  it('should return date', () => {
    const date = testContext.muFunds('date', id, source);
    assert.equal(date, '08/09/2025');
    assert.equal(fetchStub.callCount, 2);
  });

  it('should return change', () => {
    const change = testContext.muFunds('change', id, source);
    assert.equal(change, 0.0024);
    assert.equal(fetchStub.callCount, 3);
  });

  it('should return currency', () => {
    const currency = testContext.muFunds('currency', id, source);
    assert.equal(currency, 'EUR');
    assert.equal(fetchStub.callCount, 4);
  });

  it('should throw an error for expenses', () => {
    try {
      testContext.muFunds('expenses', id, source);
      assert.fail('Expected error was not thrown');
    } catch (error) {
      assert.equal(error.message, 'Requested data is not available for this asset from this data source. Please try a different source.');
    }
    assert.equal(fetchStub.callCount, 5);
  });

  it('should return category', () => {
    const category = testContext.muFunds('category', id, source);
    assert.equal(category, 'RVI GLOBAL');
    assert.equal(fetchStub.callCount, 6);
  });
});

describe('[quefondos_unit] Spanish pension plan', () => {
  const id = 'N5396';
  const source = 'quefondos';

  const html = fs.readFileSync(`./test/snapshots/quefondos_${id}.html`, 'utf8');

  const fetchStub = sinon.stub();
  fetchStub.withArgs(`https://www.quefondos.com/es/planes/ficha/index.html?isin=${id}`)
    .returns({
      getResponseCode: () => 200,
      getContentText: () => html,
      getContent: () => html,
    });

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  it('should return NAV', () => {
    const nav = testContext.muFunds('nav', id, source);
    assert.equal(nav, 16.23623);
    assert.equal(fetchStub.callCount, 1);
  });

  it('should return date', () => {
    const date = testContext.muFunds('date', id, source);
    assert.equal(date, '05/09/2025');
    assert.equal(fetchStub.callCount, 2);
  });

  it('should return change', () => {
    try {
      testContext.muFunds('change', id, source);
      assert.fail('Expected error was not thrown');
    } catch (error) {
      assert.equal(error.message, 'Requested data is not available for this asset from this data source. Please try a different source.');
    }
    assert.equal(fetchStub.callCount, 3);
  });

  it('should return currency', () => {
    const currency = testContext.muFunds('currency', id, source);
    assert.equal(currency, 'EUR');
    assert.equal(fetchStub.callCount, 4);
  });

  it('should throw an error for expenses', () => {
    try {
      testContext.muFunds('expenses', id, source);
      assert.fail('Expected error was not thrown');
    } catch (error) {
      assert.equal(error.message, 'Requested data is not available for this asset from this data source. Please try a different source.');
    }
    assert.equal(fetchStub.callCount, 5);
  });

  it('should return category', () => {
    const category = testContext.muFunds('category', id, source);
    assert.equal(category, 'RVI GLOBAL');
    assert.equal(fetchStub.callCount, 6);
  });
});
