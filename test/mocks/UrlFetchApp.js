const crypto = require('crypto');
const fetch = require('sync-fetch');
const fs = require('fs');

function sha1(value) {
  return crypto.createHash('sha1').update(value).digest('hex');
}

const cacheDuration = 60 * 1000; // 1 minute

module.exports = {
  fetch: (url, options = {}) => {
    const path = __dirname + '/../cache/' + sha1(url);

    if (fs.existsSync(path) && fs.statSync(path).mtimeMs + cacheDuration > Date.now()) {
      const text = fs.readFileSync(path, 'utf8');

      return {
        getResponseCode: () => 200,
        getContentText: () => text,
      };
    }

    const response = fetch(url);
    const text = response.text();
    fs.writeFileSync(path, text, {encoding: 'utf8', flag: 'w'});

    return {
      getResponseCode: () => response.status,
      getContentText: () => text,
    };
  }
};
