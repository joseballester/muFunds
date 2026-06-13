function loadFromMorningstar(option, id) {
  let securityId = id;

  let response;

  try {
    response = fetchMorningstarScreener(id);
  } catch (e) {}

  if (response) {
    let row;

    if (response.rows.length === 1) {
      row = response.rows[0];
    } else if (response.rows.length > 1) {
      const rows = response.rows.filter(r => {
          return r.SecId === id || r.PerformanceId === id || r.Isin === id || r.Valoren === id || r.Wkn === id || r.Sedol === id 
            || r.Mex === id || r.DgsCode === id || r.Ticker === id || r.Apir === id;
        });
      
      if (rows.length === 1) {
        row = rows[0];
      }
    }

    if (!row) {
      if (response.rows.length > 1) {
        throw AmbiguousAssetIdentifierError();
      }
      
      throw AssetNotFoundError();
    }

    if (option === 'nav' && row.ClosePrice !== undefined) {
      if (row.PriceCurrency === 'GBX') {
        return row.ClosePrice / 100;
      }

      return row.ClosePrice;
    }

    if (option === 'date' && row.ClosePriceDate !== undefined) {
      return row.ClosePriceDate;
    }

    if (option === 'currency' && row.PriceCurrency !== undefined) {
      if (row.PriceCurrency === 'GBX') {
        return 'GBP';
      }
      
      return row.PriceCurrency;
    }

    if (option === 'expenses' && row.ExpenseRatio !== undefined) {
      return row.ExpenseRatio / 100;
    }

    if (option === 'category' && row.CategoryName !== undefined) {
      return row.CategoryName;
    }

    // if (row.Universe !== 'ETALL$$ALL' && row.Isin !== undefined) {
    //   securityId = row.Isin;
    if (row.PerformanceId !== undefined) {
      securityId = row.PerformanceId;
    }
  } else {
    if (['nav', 'date', 'currency', 'change', 'return1d'].includes(option)) {
      const quoteResponse = fetchMorningstarQuoteApi(id);

      if(!(id in quoteResponse)) {
        throw AssetNotFoundError();
      }

      if (option === 'nav' && quoteResponse[id]?.lastPrice?.value !== undefined) {
        return quoteResponse[id].lastPrice.value;
      }
      
      if (option === 'date' && quoteResponse[id]?.lastPrice?.date?.value !== undefined) {
        return quoteResponse[id]?.lastPrice?.date?.value.substring(0, 10);
      }

      if (option === 'currency' && quoteResponse[id]?.lastPrice?.currency?.value !== undefined) {
        return quoteResponse[id]?.lastPrice?.currency?.value;
      }

      if ((option === 'change' || option === 'return1d') && quoteResponse[id]?.percentNetChange?.value !== undefined) {
        return quoteResponse[id]?.percentNetChange?.value / 100;
      }

      throw DataNotAvailableError();
    }
  }

  if (['category', 'expenses', 'change', 'return1d', 'return1m', 'return3m', 'return1y', 'return3y', 'return5y', 'returnytd'].includes(option)) {
    const dataResponse = fetchMorningstarScreenerDataApi(securityId);

    let result;
    if (dataResponse.results.length === 0) {
      if (response) {
        // Asset found in Screener but not in Quote API
        throw DataNotAvailableError();
      }

      throw AssetNotFoundError();
    } else if (dataResponse.results.length === 1) {
      result = dataResponse.results[0];
    } else {
      const results = dataResponse.results.filter(result => {
        return result.meta?.securityID === securityId || result.meta?.performanceID === securityId || result.meta?.fundID === securityId || 
          result.fields?.['isin']?.value === securityId || result.fields?.['dgsCode']?.value === securityId;
      });
      
      if (results.length === 1) {
        result = results[0];
      } else {
        throw AmbiguousAssetIdentifierError();
      }
    }

    if (option === 'category') {
      if (result.fields?.['morningstarCategory']?.value !== undefined) {
        return result.fields['morningstarCategory'].value;
      }
    } else if (option === 'expenses') {
      if (result.fields?.['priipsKidCosts[ongoing]']?.value !== undefined) {
        return result.fields['priipsKidCosts[ongoing]'].value / 100;
      }
    } else {
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

      if (result.fields?.[morningstarKey]?.value !== undefined) {
        return result.fields[morningstarKey].value / 100;
      }
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
      'PerformanceId',
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
  let url = `https://global.morningstar.com/api/v1/en-gb/tools/screener/_data?page=1&query=(_+~=+'${securityId}')`
    + '&fields=isin,dgsCode,morningstarCategory,priipsKidCosts[ongoing],totalReturn[1d],totalReturn[1m],totalReturn[3m],totalReturn[1y],totalReturn[3y],totalReturn[5y],totalReturn[ytd]';

  const fetch = UrlFetchApp.fetch(url);

  return JSON.parse(fetch.getContentText());
}

function fetchMorningstarQuoteApi(securityId) {
  let url = `https://global.morningstar.com/api/v1/en/stores/realtime/quotes?securities=${securityId}`;

  const fetch = UrlFetchApp.fetch(url);

  return JSON.parse(fetch.getContentText());
}
