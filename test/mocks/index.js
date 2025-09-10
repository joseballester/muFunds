const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cheerio = require('cheerio');

const CacheService = require('./CacheService');

function newTestContext(mocks = {}) {
  const files = walk(__dirname + '/../../src').filter((f) => path.extname(f) === '.js');

  const ctx = vm.createContext({
    CacheService: CacheService,
    Cheerio: cheerio,
    ...mocks,
  });

  for (let i = 0; i < files.length; i++) {
    const fpath = files[i];

    const code = fs.readFileSync(fpath);

    try {
      vm.runInContext(code, ctx, fpath);
    }
    catch (error) {
      throw error;
    }
  }

  return ctx;
}

function walk(dir) {
  let results = [];
  let list = fs.readdirSync(dir);

  list.forEach(function(file) {
    file = dir + '/' + file;
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  
  return results;
}

module.exports = newTestContext;
