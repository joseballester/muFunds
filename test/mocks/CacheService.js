module.exports ={
  getScriptCache: function() {
    return {
      store: {},
      get: function(key) {
        return this.store[key] || null;
      },
      put: function(key, value, exp) {
        this.store[key] = value;
      }
    };
  },
};
