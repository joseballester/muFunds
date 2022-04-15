const MockUrlFetchApp = function() {
  this.resultFunction = () => '';
};

MockUrlFetchApp.prototype.fetch = function(url, options) {
  const result = this.resultFunction(url, options);
  return {
    getContentText: () => result,
    getContent: () => result,
    getResponseCode: () => 200
  };
};

module.exports = MockUrlFetchApp;