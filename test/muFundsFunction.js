const record = false;

const assert = require('assert');
const gas = require('gas-local');
const fetch = require('sync-fetch');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');

const MockUrlFetchApp = require('./mocks/UrlFetchApp');
const MockCacheService = require('./mocks/CacheService');

const mocks = {
  UrlFetchApp: new MockUrlFetchApp(),
  CacheService: new MockCacheService(),
  Cheerio: cheerio,
  __proto__: gas.globalMockDefault
};
const muFunds = gas.require('./src', mocks);

function sha1(value) {
  return crypto.createHash("sha1").update(value).digest("hex");
}

mocks.UrlFetchApp.resultFunction = (url, options) => {
  const hashedUrl = sha1(url);
  const recordedFilePath = "./test/resources/muFundsFunctionRecorded/" + hashedUrl;

  var returnValue = undefined;
  if (record) {
    const fetched = fetch(url).text();
    fs.writeFileSync(recordedFilePath, fetched, {encoding: "utf8", flag: "w"});
    returnValue = fetched;
  } else {
    try {
      returnValue = fs.readFileSync(recordedFilePath, "utf8");
    } catch (error) {
      throw "Recorded file does not exist: " + recordedFilePath + ". Run in record mode.";
    }
  }

  return returnValue;
};

describe('muFunds morningstar', () => {
  const id = "US9219096024";
  const source = "morningstar";

  describe('functions', () => {
    it('should fetch NAV correctly', () => {
      const option = "nav";
      const value = muFunds.muFunds(option, id, source);
      assert.equal(value, "19.51");
    });

    it('should fetch date correctly', () => {
      const option = "date";
      const value = muFunds.muFunds(option, id, source);
      assert.equal(value, "04 Apr 2022");
    });

    it('should fetch change correctly', () => {
      const option = "change";
      const value = muFunds.muFunds(option, id, source);
      assert.equal(value, "0.0077");
    });

    it('should fetch currency correctly', () => {
      const option = "currency";
      const value = muFunds.muFunds(option, id, source);
      assert.equal(value, "USD");
    });

    it('should fetch expenses correctly', () => {
      const option = "expenses";
      const value = muFunds.muFunds(option, id, source);
      assert.equal(value, "0.0017000000000000001");
    });

    it('should fetch category correctly', () => {
      const option = "category";
      const value = muFunds.muFunds(option, id, source);
      assert.equal(value, "Foreign Large Blend");
    });

    it('should fetch source correctly', () => {
      const option = "source";
      const value = muFunds.muFunds(option, id, source);
      assert.equal(value, "morningstar");
    });
  });
});