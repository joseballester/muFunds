const crypto = require('crypto');
const fetch = require('sync-fetch');
const fs = require('fs');

const record = false; // Set to true to record new snapshots

function sha1(value) {
  return crypto.createHash('sha1').update(value).digest('hex');
}

module.exports = {
  fetch: (url, options = {}) => {
    const path = './test/snapshots/' + sha1(url);
    
    if (record) {
      const response = fetch(url);
      const text = response.text();
      fs.writeFileSync(path, text, {encoding: 'utf8', flag: 'w'});
    }

    const text = fs.readFileSync(path, 'utf8');

    return {
      getResponseCode: () => 200,
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
