function loadFromMorningstar(option, id) {
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
    term: id,
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

  const fetch = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  const json = JSON.parse(fetch.getContentText());

  const row = json.rows.length === 1 ? json.rows[0] : json.rows.find(row => {
      return row.SecId === id || row.Isin === id || row.Valoren === id || row.Wkn === id || row.Sedol === id 
        || row.Mex === id || row.DgsCode === id || row.Ticker === id || row.Apir === id;
    });

  if (!row) {
    throw AssetNotFoundError();
  }

  const values = {
    nav: row.ClosePrice ?? '-',
    change: row.GBRReturnD1 ? row.GBRReturnD1 / 100 : '-',
    date: row.ClosePriceDate ?? '-',
    currency: row.PriceCurrency ?? '-',
    expenses: row.ExpenseRatio ? row.ExpenseRatio / 100 : '-',
    category: row.CategoryName ?? '-',
  }

  if (option in values && values[option] !== '-') {
    return values[option];
  }

  throw DataNotAvailableError();
}
