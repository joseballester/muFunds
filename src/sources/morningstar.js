function loadFromMorningstar(option, id, attempts = 0) {
  const cache = CacheService.getScriptCache();

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
      'FOEUR$$ALL', // Europe funds
      'ETEUR$$ALL', // Europe ETFs

      'FOBEL$$ALL', // Belgium funds
      'ETEXG$XBRU', // Belgium ETFs
      'FOBEL$$PEN', // Belgium pension plans

      'FODNK$$ALL', // Denmark funds
      'ETEXG$XCSE', // Denmark ETFs

      'FODEU$$ALL', // Germany funds
      'ETEXG$$XFRA', // Germany ETFs (Frankfurt)
      'ETEXG$$XETR', // Germany ETFs (Xetra)

      'FOESP$$ALL', // Spain funds
      'ETEXG$XMAD', // Spain ETFs
      'FOESP$$PEN', // Spain pension plans

      'FOFRA$$ALL', // France funds
      'ETEXG$XPAR', // France ETFs
      'FOFRA$$FXP', // France pension plans (FCPI/FIP)

      'FOIRL$$ALL', // Ireland funds
      'ETEXG$XDUB', // Ireland ETFs

      'FOITA$$ALL', // Italy funds
      'ETEXG$XMIL', // Italy ETFs
      'FOITA$$PEN', // Italy pension plans

      'FONLD$$ALL', // Netherlands funds
      'ETEXG$XAMS', // Netherlands ETFs

      'FONOR$$ALL', // Norway funds
      'ETEXG$XOSE', // Norway ETFs

      'FOAUT$$ALL', // Austria funds
      'ETEXG$XWBO', // Austria ETFs

      'FOPRT$$ALL', // Portugal funds
      'ETEXG$XLIS', // Portugal ETFs

      'FOCHE$$ALL', // Switzerland funds
      'ETEXG$XSWX', // Switzerland ETFs

      'FOFIN$$ALL', // Finland funds
      'ETEXG$XHEL', // Finland ETFs

      'FOSWE$$ALL_5498', // Sweden funds
      'ETEXG$XSTO', // Sweden ETFs

      'FOGBR$$ALL', // UK funds
      'ETEXG$XLON', // UK ETFs
      'CEEXG$XLON', // UK investment trusts
      'SAGBR$$LSA', // UK pension funds 1
      'SAGBR$$PSA', // UK pension funds 2

      'FOIND$$ALL', // India funds
      'FCIND$$ALL', // India close-ended funds

      'FOCAN$$ALL', // Canada funds
      'ETCAN$$FFE', // Canada ETFs
      'E0CAN$$FST', // Canada stocks

      'FOBRA$$ALL', // Brazil funds

      'FOUSA$$ALL', // US funds
      'ETUSA$$FFE', // US ETFs

      'FOSGP$$ALL', // Singapore funds
      'ETEXG$XSES', // Singapore ETFs

      'FOIDN$$ALL', // Indonesia funds

      'FOCHL$$ALL', // Chile funds
      'ETEXG$XSGO', // Chile ETFs

      'FOMEX$$ALL', // Mexico funds
      'ETEXGRXMEX', // Mexico ETFs 1
      'ETEXGIXMEX', // Mexico ETFs 2

      'FOAUS$$ALL', // Australia investment trusts
      'FOAUS$$SAF', // Australia superannuation funds
      'FOAUS$$PAF', // Australia pension and annuities funds
      'FOAUS$$IBF', // Australia investment bonds

      'FONZL$$ALL', // New Zealand investment trusts
      'FONZL$$SAF', // New Zealand superannuation funds
      'FONZL$$IBF', // New Zealand investment bonds

      'FOHKG$$ALL', // Hong Kong funds
      'FOHKG$$PEN', // Hong Kong pension plans
      'ETEXG$XHKG', // Hong Kong ETFs

      'FOMYS$$ALL', // Malaysia funds
      'ETEXG$XKLS', // Malaysia ETFs

      'FOTHA$$ALL', // Thailand funds
      'ETEXG$XBKK', // Thailand ETFs

      'FOTWN$$ALL', // Taiwan funds
      'ETEXG$XTAI', // Taiwan ETFs

      'FOISR$$ALL', // Israel funds
      'ETEXG$XTAE', // Israel ETFs

      // 'FOALL$$ALL', // Fallback

      // 'E0WWE$$ALL', // All stocks
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

  if (option === 'url') {
    return url;
  }

  const fetch = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  if (fetch.getResponseCode() == 403) {
    const cached = cache.get(`mslt-${option}-${id}`);

    if (cached !== null) {
      if (['nav', 'change', 'expenses'].includes(option) && !isNaN(cached)) {
        return parseFloat(cached);
      } else if (cached !== '-') {
        return cached;
      }

      throw new Error('Selected option is not available for the given asset.');
    }

    if (attempts >= 5) {
      throw new Error('Morningstar error. Please delete the cell, wait 3 seconds and press Ctrl+Z to reload data.');
    }

    Utilities.sleep(1000);

    return loadFromMorningstar(option, id, attempts+1);
  }

  const json = JSON.parse(fetch.getContentText());

  const row = json.rows.length === 1 ? json.rows[0] : json.rows.find(row => {
      return row.SecId === id || row.Isin === id || row.Valoren === id || row.Wkn === id || row.Sedol === id 
        || row.Mex === id || row.DgsCode === id || row.Ticker === id || row.Apir === id;
    });

  if (!row) {
    throw new Error('Search failed. Please use a valid unique identifier for the asset.');
  }

  const values = {
    nav: row.ClosePrice ?? '-',
    change: row.GBRReturnD1 ? row.GBRReturnD1 / 100 : '-',
    date: row.ClosePriceDate ?? '-',
    currency: row.PriceCurrency ?? '-',
    expenses: row.ExpenseRatio ? row.ExpenseRatio / 100 : '-',
    category: row.CategoryName ?? '-',
  }
  
  cache.put(`mslt-nav-${id}`, values.nav, 12 * 60 * 60);
  cache.put(`mslt-change-${id}`, values.change, 12 * 60 * 60);
  cache.put(`mslt-date-${id}`, values.date, 12 * 60 * 60);
  cache.put(`mslt-currency-${id}`, values.currency, 12 * 60 * 60);
  cache.put(`mslt-expenses-${id}`, values.expenses, 12 * 60 * 60);
  cache.put(`mslt-category-${id}`, values.category, 12 * 60 * 60);

  if (option in values) {
    if (values[option] !== '-') {
      return values[option];
    }

    throw new Error('Selected option is not available for the given asset.')
  }

  throw new Error('Unknown option');
}
