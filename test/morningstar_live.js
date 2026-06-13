const assert = require('assert');

const newTestContext = require('./mocks');

const source = 'morningstar';

const testContext = newTestContext();

const testCaseFor = (ids, expectations) => {
  return () => {
    let values = {};

    ids.forEach(id => {
      ['nav', 'expenses'].forEach((option) => {
        if (expectations[option]) {
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
              message: 'Requested data is not available for this asset from this data source. Please try a different source.',
            });
          });
        }
      });

      if (expectations.date) {
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
            message: 'Requested data is not available for this asset from this data source. Please try a different source.',
          });
        });
      }

      ['currency', 'category'].forEach((option) => {
        if (expectations[option]) {
          it(`should return ${option} using ID ${id}`, () => {
            const value = testContext.muFunds(option, id, source);
            assert.equal(value, expectations[option]);
          });
        } else {
          it(`should fail for ${option} using ID ${id}`, () => {
            assert.throws(() => {
              testContext.muFunds(option, id, source);
            }, {
              message: 'Requested data is not available for this asset from this data source. Please try a different source.',
            });
          });
        }
      });

      ['change', 'return1d', 'return1m', 'return3m', 'return1y', 'return3y', 'return5y', 'returnytd'].forEach((option) => {
        if (expectations[option]) {
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
              message: 'Requested data is not available for this asset from this data source. Please try a different source.',
            });
          });
        }
      });
    });
  };
};

describe('[morningstar_live] UCITS mutual fund', testCaseFor(['0P0000V0SF'], {
  nav: true,
  date: true,
  currency: 'USD',
  expenses: true,
  category: 'Sector Equity Technology',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] UCITS mutual fund', testCaseFor(['IE00B03HD191', '0P00000WLG'], {
  nav: true,
  date: true,
  currency: 'EUR',
  expenses: true,
  category: 'Global Large-Cap Blend Equity',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] UCITS ETF', testCaseFor(['0P0001BVGE'], {
  nav: true,
  date: true,
  currency: 'EUR',
  expenses: true,
  category: 'Europe ex-UK Equity',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] UK mutual fund', testCaseFor(['GB00B7QK1Y37', 'F00000OJRV'], {
  nav: true,
  date: true,
  currency: 'GBP',
  expenses: false,
  category: 'US Large-Cap Blend Equity',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] UK pension fund', testCaseFor(['GB00B2PGGQ45', '0P0000F3DY'], {
  nav: true,
  date: true,
  currency: 'GBP',
  expenses: true,
  category: 'Japan Large-Cap Blend Equity',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Spanish pension plan', testCaseFor(['N5396', 'F000016CB6'], {
  nav: true,
  date: true,
  currency: 'EUR',
  expenses: false,
  category: 'Global Equity PP',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: false,
  returnytd: true,
}));

describe('[morningstar_live] Canadian mutual fund', testCaseFor(['EDG180', '0P0000IUYM'], {
  nav: true,
  date: true,
  currency: 'CAD',
  expenses: false,
  category: 'Global Equity Balanced',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Australian mutual fund', testCaseFor(['AU60MMF15632', 'MMF1563AU', '18568', 'F00000LKY3'], {
  nav: true,
  date: true,
  currency: 'AUD',
  expenses: false,
  category: 'Equity World Large Growth',
  change: false,
  return1d: false,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live] US mutual fund', testCaseFor(['US9229087104', 'VFIAX', '922908710', 'FOUSA00L8W'], {
  nav: true,
  date: true,
  currency: 'USD',
  expenses: false,
  category: 'Large Blend',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Chinese mutual fund', testCaseFor(['017305', 'F00001ESHW'], {
  nav: true,
  date: true,
  currency: 'CNY',
  expenses: true,
  category: 'Short-Term Bond',
  change: false,
  return1d: false,
  return1m: false,
  return3m: false,
  return1y: false,
  return3y: false,
  return5y: false,
  returnytd: false,
}));

describe('[morningstar_live] Singaporean mutual fund', testCaseFor(['SG9999002794', '0P00006Q06'], {
  nav: true,
  date: true,
  currency: 'SGD',
  expenses: true,
  category: 'Sector Equity Technology',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Indonesian mutual fund', testCaseFor(['IDN000016706', 'F000003YB6'], {
  nav: true,
  date: true,
  currency: 'IDR',
  expenses: false,
  category: 'Indonesia Equity',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Thai mutual fund', testCaseFor(['THA792010003', '0P0001PAL0'], {
  nav: true,
  date: true,
  currency: 'THB',
  expenses: true,
  category: 'Foreign Investment Miscellaneous',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: false,
  return5y: false,
  returnytd: true,
}));

describe('[morningstar_live] Brazilian mutual fund', testCaseFor(['BRVVGICTF000', 'F00000PRN3'], {
  nav: true,
  date: true,
  currency: 'BRL',
  expenses: false,
  category: 'BRL Corporate Bond',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Chilean mutual fund', testCaseFor(['CL0001523589', 'F00000ZUTU'], {
  nav: true,
  date: true,
  currency: 'CLP',
  expenses: true,
  category: 'Moderate Allocation',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Mexican mutual fund', testCaseFor(['MX52GO090015', 'F00000LVWX'], {
  nav: true,
  date: true,
  currency: 'MXN',
  expenses: true,
  category: 'MXN Aggressive Allocation',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Israeli mutual fund', testCaseFor(['IL0051252166', 'F00000ZRCT'], {
  nav: true,
  date: true,
  currency: 'ILS',
  expenses: false,
  category: 'ILS Cautious Allocation, 10% Equity Cap',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Hong Kong mutual fund', testCaseFor(['HK0000061553', '0P0001SKSP'], {
  nav: true,
  date: true,
  currency: 'HKD',
  expenses: true,
  category: 'Asia ex-Japan Equity',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));

describe('[morningstar_live] Taiwanese mutual fund', testCaseFor(['TW000T1819A9', '0P0001LF7Y'], {
  nav: true,
  date: true,
  currency: 'TWD',
  expenses: true,
  category: 'US Large-Cap Growth Equity',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: false,
  returnytd: true,
}));

describe('[morningstar_live] Malaysian mutual fund', testCaseFor(['MYU00007AA09', '0P00008MH7'], {
  nav: true,
  date: true,
  currency: 'MYR',
  expenses: true,
  category: 'Money Market - Malaysia',
  change: true,
  return1d: true,
  return1m: true,
  return3m: true,
  return1y: true,
  return3y: true,
  return5y: true,
  returnytd: true,
}));
