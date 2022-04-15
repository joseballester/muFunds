function fetchMorningstar(id) {
  return fetchURL('http://quotes.morningstar.com/fund/c-header?t=' + id, "morningstar-" + id);
}

function getNavFromMorningstar(doc) {
  const $ = Cheerio.load(doc);
  return $("[vkey='NAV']:eq(0)").text();
}

function getDateFromMorningstar(doc) {
  const $ = Cheerio.load(doc);
  return $("[vkey='LastDate']:eq(0)").text();
}

function getChangeFromMorningstar(doc) {
  const $ = Cheerio.load(doc);
  return $("[vkey='DayChange']:eq(0)").text();
}

function getCurrencyFromMorningstar(doc) {
  const $ = Cheerio.load(doc);
  return $("[vkey='PriceCurrency']:eq(0)").text();
}

function getExpensesFromMorningstar(doc) {
  const $ = Cheerio.load(doc);
  return $("[vkey='ExpenseRatio']:eq(0)").text();
}

function getCategoryFromMorningstar(doc) {
  const $ = Cheerio.load(doc);
  return $("[vkey='MorningstarCategory']:eq(0)").text();
}

function loadFromMorningstar(option, id) {
  var doc = fetchMorningstar(id);

  if (option == "nav")
    return processNav(getNavFromMorningstar(doc));
  if (option == "date")
    return processDate(getDateFromMorningstar(doc));
  if (option == "change")
    return processChange(getChangeFromMorningstar(doc));
  if (option == "currency")
    return processCurrency(getCurrencyFromMorningstar(doc));
  if (option == "expenses")
    return processExpenses(getExpensesFromMorningstar(doc));
  if (option == "category")
    return processCategory(getCategoryFromMorningstar(doc));
  if (option == "source")
    return processSource("morningstar");
}
