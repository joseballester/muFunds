const assert = require('assert');
const fs = require('fs');
const sinon = require('sinon');

const newTestContext = require('./mocks');

describe('[morningstar_unit] Happy path', () => {
  const id = 'IE00B03HD191';
  const securityId = 'F0GBR052TN';
  const source = 'morningstar';

  const screenerUrl = `https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener?outputType=json&page=1&pageSize=10&securityDataPoints=CategoryName%7CClosePrice%7CClosePriceDate%7CExpenseRatio%7CName%7CPriceCurrency%7CGBRReturnD1%7CSecId%7CUniverse%7CIsin%7CIsinMkt%7CIsinMic%7CTenforeId%7CValoren%7CWkn%7CSedol%7CMex%7CDgsCode%7CTicker%7CApir%7CCustom%7CCustomInstitutionSecurityId&term=${id}&universeIds=FOALL$$ALL%7CETALL$$ALL%7CE0WWE$$ALL%7CFOFRA$$FXP%7CSAGBR$$ALL%7CFCIND$$ALL%7CCEEXG$XLON&version=1`;
  const screenerDataApiUrl = `https://global.morningstar.com/api/v1/en-gb/tools/screener/_data?page=1&limit=1&query=(_+~=+'${securityId}')&fields=totalReturn[1d],totalReturn[1m],totalReturn[3m],totalReturn[1y],totalReturn[3y],totalReturn[5y],totalReturn[ytd]`;

  const fetchStub = sinon.stub();
  fetchStub.withArgs(screenerUrl)
    .returns({
      getResponseCode: () => 200,
      getContentText: () => fs.readFileSync(`./test/snapshots/morningstar_${id}.json`, 'utf8'),
    });
  fetchStub.withArgs(screenerDataApiUrl)
    .returns({
      getResponseCode: () => 200,
      getContentText: () => fs.readFileSync(`./test/snapshots/morningstar_returns_${securityId}.json`, 'utf8'),
    });

  const testContext = newTestContext({
    UrlFetchApp: {
      fetch: fetchStub,
    },
  });

  const expectedValues = {
    nav: 52.5631,
    date: '2025-09-09',
    currency: 'EUR',
    expenses: 0.0018,
    category: 'Global Large-Cap Blend Equity',
  }

  Object.keys(expectedValues).forEach((option) => {
    it(`should return ${option} with first fetch only`, () => {
      const value = testContext.muFunds(option, id, source);
      assert.equal(value, expectedValues[option]);

      assert.ok(fetchStub.alwaysCalledWith(screenerUrl));
      assert.equal(fetchStub.callCount, 1);
      fetchStub.resetHistory();
    });
  });

  const expectedReturns = {
    change: 0.0023135,
    return1d: 0.0023135,
    return1m: 0.0204466,
    return3m: 0.0779001,
    return1y: 0.12271140000000001,
    return3y: 0.1351934,
    return5y: 0.1394561,
    returnytd: 0.0247453,
  }

  Object.keys(expectedReturns).forEach((option) => {
    it(`should return ${option} with two fetches`, () => {
      const value = testContext.muFunds(option, id, source);
      assert.equal(value, expectedReturns[option]);

      assert.ok(fetchStub.calledWith(screenerUrl));
      assert.ok(fetchStub.calledWith(screenerDataApiUrl));
      assert.equal(fetchStub.callCount, 2);
      fetchStub.resetHistory();
    });
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

  ['nav', 'date', 'currency', 'expenses', 'category'].forEach((option) => {
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
