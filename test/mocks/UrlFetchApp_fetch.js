const fetch = require('sync-fetch');

module.exports = {
  fetch: (url, options = {}) => {
    const response = fetch(url);
    const text = response.text();

    return {
      getResponseCode: () => response.status,
      getContentText: () => text,
      getContent: () => {
        let bytes = [];
        for (let i = 0; i < text.length; i++) {
          bytes.push(text.charCodeAt(i) & 0xFF);
        }
        return bytes;
      }
    };
  }
};
