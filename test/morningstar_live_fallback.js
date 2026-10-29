const assert = require('assert');
const UrlFetchApp = require('./mocks/UrlFetchApp');

const newTestContext = require('./mocks');

const source = 'morningstar';

const testContext = newTestContext({
  UrlFetchApp: {
    fetch: (url, options = {}) => {
      if (url.startsWith('https://lt.morningstar.com/')) {
        throw new Error('Triggering error for Morningstar Screener to test fallback.');
      }

      return UrlFetchApp.fetch(url, options);
    },
  },
});

const notAvailableMessage = 'Requested data is not available for this asset from this data source. Please try a different source.';
const notFoundMessage = 'Asset not found. Please use another identifier and/or data source.';

// The fallback only reads these options from the Quote API. Any other option fails before a request is made.
const quoteApiOptions = ['nav', 'date', 'currency', 'change', 'return1d'];

// notFoundIds: identifiers the Quote API does not resolve (e.g. tickers or local codes).
const testCaseFor = (ids, expectations, notFoundIds = []) => {
  return () => {
    let values = {};

    ids.forEach(id => {
      const notFound = notFoundIds.includes(id);
      const expects = (option) => !notFound && expectations[option];
      const failMessage = (option) => notFound && quoteApiOptions.includes(option) ? notFoundMessage : notAvailableMessage;

      ['nav', 'expenses'].forEach((option) => {
        if (expects(option)) {
          it(`should return ${option} using ID ${id}`, () => {
            const value = testContext.muFunds(option, id, source);
            if (values[option]) {
              assert.equal(value, values[option]);
            } else {
              assert.ok(!isNaN(value));
              assert.ok(value > 0);
              values[option] = value;
            }
          });
        } else {
          it(`should fail for ${option} using ID ${id}`, () => {
            assert.throws(() => {
              testContext.muFunds(option, id, source);
            }, {
              message: failMessage(option),
            });
          });
        }
      });

      if (expects('date')) {
        it(`should return date using ID ${id}`, () => {
          const date = testContext.muFunds('date', id, source);
          if (values.date) {
            assert.equal(date, values.date);
          } else {
            assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
            values.date = date;
          }
        });
      } else {
        it(`should fail for date using ID ${id}`, () => {
          assert.throws(() => {
            testContext.muFunds('date', id, source);
          }, {
            message: failMessage('date'),
          });
        });
      }

      ['currency', 'category'].forEach((option) => {
        if (expects(option)) {
          it(`should return ${option} using ID ${id}`, () => {
            const value = testContext.muFunds(option, id, source);
            assert.equal(value, expectations[option]);
          });
        } else {
          it(`should fail for ${option} using ID ${id}`, () => {
            assert.throws(() => {
              testContext.muFunds(option, id, source);
            }, {
              message: failMessage(option),
            });
          });
        }
      });

      ['change', 'return1d', 'return1m', 'return3m', 'return1y', 'return3y', 'return5y', 'returnytd'].forEach((option) => {
        if (expects(option)) {
          it(`should return ${option} using ID ${id}`, () => {
            const value = testContext.muFunds(option, id, source);
            if (values[option]) {
              assert.equal(value, values[option]);
            } else {
              assert.ok(!isNaN(value));
              values[option] = value;
            }
          });
        } else {
          it(`should fail for ${option} using ID ${id}`, () => {
            assert.throws(() => {
              testContext.muFunds(option, id, source);
            }, {
              message: failMessage(option),
            });
          });
        }
      });
    });
  };
};

describe('[morningstar_live_fallback] UCITS mutual fund', testCaseFor(['IE00B03HD191', '0P00000WLG'], {
  nav: true,
  date: true,
  currency: 'EUR',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] UCITS ETF', testCaseFor(['0P0001BVGE'], {
  nav: true,
  date: true,
  currency: 'EUR',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] UK mutual fund', testCaseFor(['GB00B7QK1Y37', 'F00000OJRV'], {
  nav: true,
  date: true,
  currency: 'GBP',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] UK pension fund', testCaseFor(['GB00B2PGGQ45', '0P0000F3DY'], {
  nav: false,
  date: false,
  currency: false,
  expenses: false,
  category: false,
  change: false,
  return1d: false,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}, ['GB00B2PGGQ45', '0P0000F3DY']));

describe('[morningstar_live_fallback] Spanish pension plan', testCaseFor(['N5396', 'F000016CB6'], {
  nav: true,
  date: true,
  currency: 'EUR',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}, ['N5396']));

describe('[morningstar_live_fallback] Canadian mutual fund', testCaseFor(['EDG180', '0P0000IUYM'], {
  nav: true,
  date: true,
  currency: 'CAD',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}, ['EDG180']));

describe('[morningstar_live_fallback] Australian mutual fund', testCaseFor(['AU60MMF15632', 'MMF1563AU', '18568', 'F00000LKY3'], {
  nav: false,
  date: false,
  currency: false,
  expenses: false,
  category: false,
  change: false,
  return1d: false,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}, ['MMF1563AU', '18568']));

describe('[morningstar_live_fallback] US mutual fund', testCaseFor(['US9229087104', 'VFIAX', '922908710', 'FOUSA00L8W'], {
  nav: true,
  date: true,
  currency: 'USD',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}, ['VFIAX']));

describe('[morningstar_live_fallback] Chinese mutual fund', testCaseFor(['017305', 'F00001ESHW'], {
  nav: true,
  date: true,
  currency: 'CNY',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}, ['017305']));

describe('[morningstar_live_fallback] Singaporean mutual fund', testCaseFor(['SG9999002794', '0P00006Q06'], {
  nav: true,
  date: true,
  currency: 'SGD',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] Indonesian mutual fund', testCaseFor(['IDN000016706', 'F000003YB6'], {
  nav: true,
  date: true,
  currency: 'IDR',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] Thai mutual fund', testCaseFor(['THA792010003', '0P0001PAL0'], {
  nav: false,
  date: false,
  currency: false,
  expenses: false,
  category: false,
  change: false,
  return1d: false,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] Brazilian mutual fund', testCaseFor(['BR018ZCTF006', 'F000013FB3'], {
  nav: true,
  date: true,
  currency: 'BRL',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] Chilean mutual fund', testCaseFor(['CL0001523589', 'F00000ZUTU'], {
  nav: true,
  date: true,
  currency: 'CLP',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] Mexican mutual fund', testCaseFor(['MX52GO090015', 'F00000LVWX'], {
  nav: true,
  date: true,
  currency: 'MXN',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] Israeli mutual fund', testCaseFor(['IL0051252166', 'F00000ZRCT'], {
  nav: true,
  date: true,
  currency: 'ILS',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] Hong Kong mutual fund', testCaseFor(['HK0000061553', '0P0001SKSP'], {
  nav: true,
  date: true,
  currency: 'HKD',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] Taiwanese mutual fund', testCaseFor(['TW000T1819A9', '0P0001LF7Y'], {
  nav: true,
  date: true,
  currency: 'TWD',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live_fallback] Malaysian mutual fund', testCaseFor(['MYU00007AA09', '0P00008MH7'], {
  nav: true,
  date: true,
  currency: 'MYR',
  expenses: false,
  category: false,
  change: true,
  return1d: true,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));
