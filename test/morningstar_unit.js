const assert = require('assert');
const fs = require('fs');
const sinon = require('sinon');

const newTestContext = require('./mocks');

const screenerUrl = (term, currency = 'EUR') => 'https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener'
  + `?outputType=json&page=1&pageSize=10&currencyId=${currency}`
  + '&securityDataPoints=CategoryName%7CClosePrice%7CClosePriceDate%7CExpenseRatio%7CName%7CPriceCurrency'
  + '%7CGBRReturnD1%7CGBRReturnM1%7CGBRReturnM3%7CGBRReturnM0%7CGBRReturnM12%7CGBRReturnM36%7CGBRReturnM60'
  + '%7CSecId%7CPerformanceId%7CUniverse%7CIsin%7CIsinMkt%7CIsinMic%7CTenforeId%7CValoren%7CWkn%7CSedol%7CMex'
  + '%7CDgsCode%7CTicker%7CApir%7CCustom%7CCustomInstitutionSecurityId'
  + `&term=${term}`
  + '&universeIds=FOALL$$ALL%7CETALL$$ALL%7CE0WWE$$ALL%7CFOFRA$$FXP%7CSAGBR$$ALL%7CFCIND$$ALL%7CCEEXG$XLON&version=1';

const jsonResponse = (text) => ({
  getResponseCode: () => 200,
  getContentText: () => text,
});

describe('[morningstar_unit] Happy path', () => {
  // The snapshot holds two rows: the target fund and a similar UK pension fund,
  // so the row has to be picked by matching the ISIN.
  const id = 'IE00B03HD191';
  const source = 'morningstar';

  const fetchStub = sinon.stub();
  fetchStub.withArgs(screenerUrl(id))
    .returns(jsonResponse(fs.readFileSync(`./test/snapshots/morningstar_${id}.json`, 'utf8')));

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  afterEach(() => {
    fetchStub.resetHistory();
  });

  const expectedValues = {
    nav: 65.6729,
    date: '2026-10-28',
    currency: 'EUR',
    expenses: 0.0018,
    category: 'Global Large-Cap Blend Equity',
  };

  Object.keys(expectedValues).forEach((option) => {
    it(`should return ${option} with one fetch`, () => {
      const value = testContext.muFunds(option, id, source);
      assert.equal(value, expectedValues[option]);

      assert.ok(fetchStub.alwaysCalledWith(screenerUrl(id)));
      assert.equal(fetchStub.callCount, 1);
    });
  });

  const expectedReturns = {
    change: 0.0024,
    return1d: 0.0024,
    return1m: 0.0234,
    return3m: 0.0538,
    return1y: 0.1805,
    return3y: 0.2124,
    return5y: 0.1175,
    returnytd: 0.1861,
  };

  Object.keys(expectedReturns).forEach((option) => {
    it(`should return ${option} with one fetch`, () => {
      const value = testContext.muFunds(option, id, source);
      assert.ok(Math.abs(value - expectedReturns[option]) < 1e-9, `${value} != ${expectedReturns[option]}`);

      assert.ok(fetchStub.alwaysCalledWith(screenerUrl(id)));
      assert.equal(fetchStub.callCount, 1);
    });
  });
});

describe('[morningstar_unit] Result with no attributes', () => {
  const id = 'security_id';
  const source = 'morningstar';

  const fetchStub = sinon.stub();
  fetchStub.withArgs(screenerUrl(id))
    .returns(jsonResponse('{"rows":[{"SecId":"security_id"}]}'));

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  afterEach(() => {
    fetchStub.resetHistory();
  });

  ['nav', 'date', 'currency', 'expenses', 'category', 'change', 'return1y'].forEach((option) => {
    it(`should throw an error for ${option}`, () => {
      assert.throws(() => {
        testContext.muFunds(option, id, source);
      }, {
        message: 'Requested data is not available for this asset from this data source. Please try a different source.',
      });
      assert.equal(fetchStub.callCount, 1);
    });
  });
});

describe('[morningstar_unit] No results', () => {
  const id = 'wrong_id';
  const source = 'morningstar';

  const fetchStub = sinon.stub();
  fetchStub.withArgs(screenerUrl(id))
    .returns(jsonResponse('{"rows":[]}'));

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  it('should throw an error', () => {
    assert.throws(() => {
      testContext.muFunds('nav', id, source);
    }, {
      message: 'Asset not found. Please use another identifier and/or data source.',
    });
    assert.equal(fetchStub.callCount, 1);
  });
});
