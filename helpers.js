/* ----------- Data processing functions ----------- */
function isISIN(id) {
  // ISIN have 12 characters
  // Not the most robust way (TODO: improve it)
  return id.length == 12;
}

function stripCharacters_(text) {
  return text.trim().replace(/\n/g, '').replace(/\t/g, '');
}

function processNav(nav) {
  nav = stripCharacters_(nav);
  nav = nav.replace(',', '.');
  if (!isNaN(parseFloat(nav)) && isFinite(nav))
    return parseFloat(nav);
  else
    throw new Error("NAV is not available for this asset and source. Please try another data source.");
}

function processDate(date) {
  date = stripCharacters_(date);
  return date;
}

function processChange(change) {
  change = stripCharacters_(change);
  change = change.replace(',', '.').replace('%', '');
  if (!isNaN(parseFloat(change)) && isFinite(change))
    return parseFloat(change)/100;
  else 
    throw new Error("Last change is not available for this asset and source. Please try another data source.");
}

function processCurrency(currency) {
  currency = stripCharacters_(currency);
  return currency;
}

function processExpenses(expenses) {
  expenses = stripCharacters_(expenses);
  expenses = expenses.replace(',', '.').replace('%', '');
  if (!isNaN(parseFloat(expenses)) && isFinite(expenses))
    return parseFloat(expenses)/100;
  else
    throw new Error("Expenses ratio is not available for this asset and source. Please try another data source.");
}

function processCategory(category) {
  category = stripCharacters_(category);
  return category;
}

function processSource(source) {
  source = stripCharacters_(source);
  return source;
}

/* -------- Fetching cached/non-cached pages -------- */
function fetchURL(url, cacheid) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheid);
  if (cached != null) {
    return cached;
  }

  const fetch = UrlFetchApp.fetch(url);
  if (fetch.getResponseCode() == 200 && fetch.getContent().length > 0) {
    const body = fetch.getContentText();
    const $ = Cheerio.load(body);
    const trimmed = $("body").html();
    cache.put(cacheid, trimmed, 7200);
    return trimmed;
  } else {
    throw new Error("Wrong combination of asset identifier and source. Please check the accepted ones at the documentation.");
  }
}
