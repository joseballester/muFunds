const MockCache = require('./cache');

const MockCacheService = function() {
  this.scriptCache = new MockCache();
};

MockCacheService.prototype.getScriptCache = function() {
  return this.scriptCache;
};

module.exports = MockCacheService;