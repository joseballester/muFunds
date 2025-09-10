const assert = require('assert');
const newTestContext = require('./mocks');

const UrlFetchAppFromFile = require('./mocks/UrlFetchApp_file');

const cases = [
  {
    description: 'UCITS mutual fund by ISIN',
    id: 'IE00B03HD191',
    expected_nav: 52.5631,
    expected_date: '2025-09-09',
    expected_change: 0.0017000000000000001,
    expected_currency: 'EUR',
    expected_expenses: 0.0018,
    expected_category: 'Global Large-Cap Blend Equity',
  },
  {
    description: 'UCITS mutual fund by Morningstar ID',
    id: 'F0GBR052TN',
    expected_nav: 52.5631,
    expected_date: '2025-09-09',
    expected_change: 0.0017000000000000001,
    expected_currency: 'EUR',
    expected_expenses: 0.0018,
    expected_category: 'Global Large-Cap Blend Equity',
  },
  {
    description: 'UK mutual fund by ISIN',
    id: 'GB00B7QK1Y37',
    expected_nav: 886.375,
    expected_date: '2025-09-09',
    expected_change: -0.0008,
    expected_currency: 'GBX',
    expected_expenses: null,
    expected_category: 'US Large-Cap Blend Equity',
  },
  {
    description: 'UK mutual fund by Morningstar ID',
    id: 'F00000OJRV',
    expected_nav: 886.375,
    expected_date: '2025-09-09',
    expected_change: -0.0008,
    expected_currency: 'GBX',
    expected_expenses: null,
    expected_category: 'US Large-Cap Blend Equity',
  },
  {
    description: 'UK pension fund by ISIN',
    id: 'GB00B2PGGQ45',
    expected_nav: 412.5,
    expected_date: '2025-09-09',
    expected_change: -0.0019,
    expected_currency: 'GBX',
    expected_expenses: 0.01,
    expected_category: 'Japan Large-Cap Blend Equity',
  },
  {
    description: 'UK pension fund by Morningstar ID',
    id: 'VAUSA06JG4',
    expected_nav: 412.5,
    expected_date: '2025-09-09',
    expected_change: -0.0019,
    expected_currency: 'GBX',
    expected_expenses: 0.01,
    expected_category: 'Japan Large-Cap Blend Equity',
  },
  {
    description: 'Spanish pension plan by DGS code',
    id: 'N5396',
    expected_nav: 16.23624,
    expected_date: '2025-09-05',
    expected_change: -0.0038,
    expected_currency: 'EUR',
    expected_expenses: null,
    expected_category: 'Global Equity PP',
  },
  {
    description: 'Spanish pension plan by Morningstar ID',
    id: 'F000016CB6',
    expected_nav: 16.23624,
    expected_date: '2025-09-05',
    expected_change: -0.0038,
    expected_currency: 'EUR',
    expected_expenses: null,
    expected_category: 'Global Equity PP',
  },
  {
    description: 'Canadian mutual fund by fund code',
    id: 'EDG180',
    expected_nav: 29.8061,
    expected_date: '2025-09-09',
    expected_change: -0.0006,
    expected_currency: 'CAD',
    expected_expenses: null,
    expected_category: 'Global Equity Balanced',
  },
  {
    description: 'Canadian mutual fund by Morningstar ID',
    id: 'F000002ESI',
    expected_nav: 29.8061,
    expected_date: '2025-09-09',
    expected_change: -0.0006,
    expected_currency: 'CAD',
    expected_expenses: null,
    expected_category: 'Global Equity Balanced',
  },
  {
    description: 'Australian mutual fund by ISIN',
    id: 'AU60MMF15632',
    expected_nav: 1.68715,
    expected_date: '2025-09-08',
    expected_change: null,
    expected_currency: 'AUD',
    expected_expenses: null,
    expected_category: 'Equity World Large Growth',
  },
  {
    description: 'Australian mutual fund by APIR',
    id: 'MMF1563AU',
    expected_nav: 1.68715,
    expected_date: '2025-09-08',
    expected_change: null,
    expected_currency: 'AUD',
    expected_expenses: null,
    expected_category: 'Equity World Large Growth',
  },
  {
    description: 'Australian mutual fund by Morningstar ID',
    id: 'F00000LKY3',
    expected_nav: 1.68715,
    expected_date: '2025-09-08',
    expected_change: null,
    expected_currency: 'AUD',
    expected_expenses: null,
    expected_category: 'Equity World Large Growth',
  },
  {
    description: 'US mutual fund by ISIN',
    id: 'US9229087104',
    expected_nav: 602.40,
    expected_date: '2025-09-09',
    expected_change: 0.0023,
    expected_currency: 'USD',
    expected_expenses: null,
    expected_category: 'Large Blend',
  },
  {
    description: 'US mutual fund by ticker',
    id: 'VFIAX',
    expected_nav: 602.40,
    expected_date: '2025-09-09',
    expected_change: 0.0023,
    expected_currency: 'USD',
    expected_expenses: null,
    expected_category: 'Large Blend',
  },
  {
    description: 'US mutual fund by CUSIP',
    id: '922908710',
    expected_nav: 602.40,
    expected_date: '2025-09-09',
    expected_change: 0.0023,
    expected_currency: 'USD',
    expected_expenses: null,
    expected_category: 'Large Blend',
  },
  {
    description: 'US fund by Morningstar ID',
    id: 'FOUSA00L8W',
    expected_nav: 602.40,
    expected_date: '2025-09-09',
    expected_change: 0.0023,
    expected_currency: 'USD',
    expected_expenses: null,
    expected_category: 'Large Blend',
  },
];

const source = 'morningstar';

const testContext = newTestContext({
  UrlFetchApp: UrlFetchAppFromFile,
});

cases.forEach(c => {
  describe(`[morningstar] Unit test (${c.description}: ${c.id})`, () => {
    ['nav', 'date', 'change', 'currency', 'expenses', 'category']
      .forEach(option => {
        it(`should return ${option}`, () => {
          if (c[`expected_${option}`] !== null) {
            const result = testContext.muFunds(option, c.id, source);
            assert.equal(result, c[`expected_${option}`]);
          } else {
            try {
              testContext.muFunds(option, c.id, source);
              assert.fail('Expected error was not thrown');
            } catch (e) {
              assert.equal(e.message, 'Selected option is not available for the given asset.');
            }
          }
        });
      });
  });
});
