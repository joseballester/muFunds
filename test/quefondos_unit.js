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
    });

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  const expectedValues = {
    nav: 52.3934,
    date: '08/09/2025',
    currency: 'EUR',
    category: 'RVI GLOBAL',
    change: 0.0024,
    return1d: 0.0024,
    return1m: 0.0125,
    return3m: 0.0438,
    return1y: 0.1457,
    return3y: 0.1217,
    return5y: 0.1400,
    returnytd: 0.0092,
  };

  Object.keys(expectedValues).forEach((option) => {
    it(`should return ${option}`, () => {
      const value = testContext.muFunds(option, id, source);
      assert.equal(value, expectedValues[option]);

      assert.equal(fetchStub.callCount, 1);
      fetchStub.resetHistory();
    });
  });

  it('should throw an error for expenses', () => {
    try {
      testContext.muFunds('expenses', id, source);
      assert.fail('Expected error was not thrown');
    } catch (error) {
      assert.equal(error.message, 'Requested data is not available for this asset from this data source. Please try a different source.');
    }
    assert.equal(fetchStub.callCount, 1);
    fetchStub.resetHistory();
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
    });

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  const expectedValues = {
    nav: 16.23623,
    date: '05/09/2025',
    currency: 'EUR',
    category: 'RVI GLOBAL',
    return1m: 0.0096,
    return3m: 0.0470,
    return1y: 0.1329,
    return3y: 0.1070,
    returnytd: 0.011399999999999999,
  };

  Object.keys(expectedValues).forEach((option) => {
    it(`should return ${option}`, () => {
      const value = testContext.muFunds(option, id, source);
      assert.equal(value, expectedValues[option]);

      assert.equal(fetchStub.callCount, 1);
      fetchStub.resetHistory();
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
      assert.equal(fetchStub.callCount, 1);
      fetchStub.resetHistory();
    });
  });
});
