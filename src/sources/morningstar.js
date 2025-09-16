function loadFromMorningstar(option, id) {
  const response = fetchMorningstarScreener(id);

  const row = response.rows.length === 1
    ? response.rows[0]
    : response.rows.find(row => {
        return row.SecId === id || row.Isin === id || row.Valoren === id || row.Wkn === id || row.Sedol === id 
          || row.Mex === id || row.DgsCode === id || row.Ticker === id || row.Apir === id;
      });

  if (!row) {
    throw AssetNotFoundError();
  }

  if (option === 'nav' && row.ClosePrice !== undefined) {
    return row.ClosePrice;
  }

  if (option === 'date' && row.ClosePriceDate !== undefined) {
    return row.ClosePriceDate;
  }

  if (option === 'currency' && row.PriceCurrency !== undefined) {
    return row.PriceCurrency;
  }

  if (option === 'expenses' && row.ExpenseRatio !== undefined) {
    return row.ExpenseRatio / 100;
  }

  if (option === 'category' && row.CategoryName !== undefined) {
    return row.CategoryName;
  }

  if (['change', 'return1d', 'return1m', 'return3m', 'return1y', 'return3y', 'return5y', 'returnytd'].includes(option)) {
    const returns = fetchMorningstarScreenerDataApi(row.SecId);

    const morningstarKey = {
      'change': 'totalReturn[1d]',
      'return1d': 'totalReturn[1d]',
      'return1m': 'totalReturn[1m]',
      'return3m': 'totalReturn[3m]',
      'return1y': 'totalReturn[1y]',
      'return3y': 'totalReturn[3y]',
      'return5y': 'totalReturn[5y]',
      'returnytd': 'totalReturn[ytd]',
    }[option];

    if (returns.results.length > 0 && returns.results[0].fields?.[morningstarKey]?.value !== undefined) {
      return returns.results[0].fields[morningstarKey].value / 100;
    }
  }

  throw DataNotAvailableError();
}

function fetchMorningstarScreener(term) {
  let url = 'https://lt.morningstar.com/api/rest.svc/klr5zyak8x/security/screener';

  const params = {
    outputType: 'json',
    page: 1,
    pageSize: 10,
    securityDataPoints: [
      'CategoryName',
      'ClosePrice',
      'ClosePriceDate',
      'ExpenseRatio',
      'Name',
      'PriceCurrency',
      'GBRReturnD1',
      'SecId',
      'Universe',
      'Isin',
      'IsinMkt',
      'IsinMic',
      'TenforeId',
      'Valoren',  // Swiss financial instruments identifier
      'Wkn',      // German financial instruments identifier
      'Sedol',    // European Stock Exchange Daily Official List (SEDOL) number
      'Mex',      // Financial Times code for investment funds
      'DgsCode',  // Spain Dirección General de Seguros code for pension plans
      'Ticker',   // Stock ticker
      'Apir',     // Australia fund code
      'Custom',
      'CustomInstitutionSecurityId',
    ],
    term: term,
    universeIds: [
      'FOALL$$ALL', // All open-ended funds
      'ETALL$$ALL', // All ETFs
      'E0WWE$$ALL', // All stocks

      // Additional universe IDs that need to be explicitly included
      'FOFRA$$FXP', // French pension funds
      'SAGBR$$ALL', // All UK pension funds
      'FCIND$$ALL', // Indian closed-end funds
      'CEEXG$XLON', // LSE investment trusts
    ],
    version: 1,
  };

  url += Object.keys(params)
      .reduce((url, key, position) => {
        const joiner = position === 0 ? '?' : '&';

        let value = params[key];

        if (Array.isArray(value)) {
          value = value.join(encodeURIComponent('|'));
        } else {
          value = encodeURIComponent(value);
        }

        return url + joiner + key + '=' + value;
      }, '');

  const fetch = UrlFetchApp.fetch(url);

  return JSON.parse(fetch.getContentText());
}


function fetchMorningstarScreenerDataApi(securityId) {
  let url = `https://global.morningstar.com/api/v1/en-gb/tools/screener/_data?page=1&limit=1&query=(_+~=+'${securityId}')`
    + '&fields=totalReturn[1d],totalReturn[1m],totalReturn[3m],totalReturn[1y],totalReturn[3y],totalReturn[5y],totalReturn[ytd]';

  const fetch = UrlFetchApp.fetch(url);

  return JSON.parse(fetch.getContentText());
}
