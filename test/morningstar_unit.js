const assert = require('assert');
const fs = require('fs');
const sinon = require('sinon');

const newTestContext = require('./mocks');

describe('[morningstar_unit] Happy path', () => {
  const id = 'IE00B03HD191';
  const source = 'morningstar';

  const json = fs.readFileSync(`./test/snapshots/morningstar_${id}.json`, 'utf8');

  const fetchStub = sinon.stub();
  fetchStub.withArgs(`https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener?outputType=json&page=1&pageSize=10&securityDataPoints=CategoryName%7CClosePrice%7CClosePriceDate%7CExpenseRatio%7CName%7CPriceCurrency%7CGBRReturnD1%7CSecId%7CUniverse%7CIsin%7CIsinMkt%7CIsinMic%7CTenforeId%7CValoren%7CWkn%7CSedol%7CMex%7CDgsCode%7CTicker%7CApir%7CCustom%7CCustomInstitutionSecurityId&term=${id}&universeIds=FOALL$$ALL%7CETALL$$ALL%7CE0WWE$$ALL%7CFOFRA$$FXP%7CSAGBR$$ALL%7CFCIND$$ALL%7CCEEXG$XLON&version=1`)
    .returns({
      getResponseCode: () => 200,
      getContentText: () => json,
      getContent: () => json,
    });

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  it('should return NAV', () => {
    const nav = testContext.muFunds('nav', id, source);
    assert.equal(nav, 52.5631);
    assert.equal(fetchStub.callCount, 1);
  });

  it('should return date', () => {
    const date = testContext.muFunds('date', id, source);
    assert.equal(date, '2025-09-09');
    assert.equal(fetchStub.callCount, 2);
  });

  it('should return change', () => {
    const change = testContext.muFunds('change', id, source);
    assert.equal(change, 0.0017000000000000001);
    assert.equal(fetchStub.callCount, 3);
  });

  it('should return currency', () => {
    const currency = testContext.muFunds('currency', id, source);
    assert.equal(currency, 'EUR');
    assert.equal(fetchStub.callCount, 4);
  });

  it('should return expenses', () => {
    const expenses = testContext.muFunds('expenses', id, source);
    assert.equal(expenses, 0.0018);
    assert.equal(fetchStub.callCount, 5);
  });

  it('should return category', () => {
    const category = testContext.muFunds('category', id, source);
    assert.equal(category, 'Global Large-Cap Blend Equity');
    assert.equal(fetchStub.callCount, 6);
  });
});

describe('[morningstar_unit] Result with no attributes', () => {
  const id = 'security_id';
  const source = 'morningstar';

  const fetchStub = sinon.stub();
  fetchStub.withArgs(`https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener?outputType=json&page=1&pageSize=10&securityDataPoints=CategoryName%7CClosePrice%7CClosePriceDate%7CExpenseRatio%7CName%7CPriceCurrency%7CGBRReturnD1%7CSecId%7CUniverse%7CIsin%7CIsinMkt%7CIsinMic%7CTenforeId%7CValoren%7CWkn%7CSedol%7CMex%7CDgsCode%7CTicker%7CApir%7CCustom%7CCustomInstitutionSecurityId&term=${id}&universeIds=FOALL$$ALL%7CETALL$$ALL%7CE0WWE$$ALL%7CFOFRA$$FXP%7CSAGBR$$ALL%7CFCIND$$ALL%7CCEEXG$XLON&version=1`)
    .returns({
      getResponseCode: () => 200,
      getContentText: () => '{"rows":[{"SecId":"security_id"}]}',
      getContent: () => '{"rows":[{"SecId":"security_id"}]}',
    });

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  ['nav', 'date', 'change', 'currency', 'expenses', 'category'].forEach((option) => {
    it(`should throw an error for ${option}`, () => {
      try {
        testContext.muFunds(option, id, source);
        assert.fail('Expected error was not thrown');
      }
      catch (error) {
        assert.equal(error.message, 'Requested data is not available for this asset from this data source. Please try a different source.');
      }
      assert.equal(fetchStub.callCount, 1);
      fetchStub.resetHistory();
    });
  });
});


describe('[morningstar_unit] No results', () => {
  const id = 'wrong_id';
  const source = 'morningstar';

  const fetchStub = sinon.stub();
  fetchStub.withArgs(`https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener?outputType=json&page=1&pageSize=10&securityDataPoints=CategoryName%7CClosePrice%7CClosePriceDate%7CExpenseRatio%7CName%7CPriceCurrency%7CGBRReturnD1%7CSecId%7CUniverse%7CIsin%7CIsinMkt%7CIsinMic%7CTenforeId%7CValoren%7CWkn%7CSedol%7CMex%7CDgsCode%7CTicker%7CApir%7CCustom%7CCustomInstitutionSecurityId&term=${id}&universeIds=FOALL$$ALL%7CETALL$$ALL%7CE0WWE$$ALL%7CFOFRA$$FXP%7CSAGBR$$ALL%7CFCIND$$ALL%7CCEEXG$XLON&version=1`)
    .returns({
      getResponseCode: () => 200,
      getContentText: () => '{"rows":[]}',
      getContent: () => '{"rows":[]}',
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
