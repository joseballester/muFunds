const assert = require('assert');

const newTestContext = require('./mocks');

describe('[main] Parameter validation', () => {
  const testContext = newTestContext();

  it('should return an error if option is unknown', () => {
    try {
      testContext.muFunds('unknown_option', 'asset_id');
      assert.fail('Expected error was not thrown');
    }
    catch (error) {
      assert.equal(error.message, 'Unknown option. Check the docs at mufunds.com/usage.html');
    }
  });

  it('should return an error if id is empty', () => {
    try {
      testContext.muFunds('nav', '');
      assert.fail('Expected error was not thrown');
    }
    catch (error) {
      assert.equal(error.message, 'Asset identifier is empty.');
    }
  });

  it('should return an error if source is unknown', () => {
    try {
      testContext.muFunds('nav', 'asset_id', 'unknown_source');
      assert.fail('Expected error was not thrown');
    }
    catch (error) {
      assert.equal(error.message, 'Unknown data source. Check the docs at mufunds.com/usage.html');
    }
  });
});
