const fetch = require('sync-fetch');

module.exports = {
  fetch: (url, options = {}) => {
    const response = fetch(url);
    const text = response.text();

    return {
      getResponseCode: () => response.status,
      getContentText: () => text,
    };
  }
};
