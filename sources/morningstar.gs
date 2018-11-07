function fetchMorningstar(id) {
  return fetchURL('http://quotes.morningstar.com/fund/c-header?t=' + id, "morningstar-" + id);
}

function getNavFromMorningstar(doc) {
  return getElementsByAttribute(doc, 'vkey', "NAV")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getDateFromMorningstar(doc) {
  return getElementsByAttribute(doc, 'vkey', "LastDate")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getChangeFromMorningstar(doc) {
  return getElementsByAttribute(doc, 'vkey', "DayChange")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getCurrencyFromMorningstar(doc) {
  return getElementsByAttribute(doc, 'vkey', "PriceCurrency")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getExpensesFromMorningstar(doc) {
  return getElementsByAttribute(doc, 'vkey', "ExpenseRatio")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getCategoryFromMorningstar(doc) {
  return getElementsByAttribute(doc, 'vkey', "MorningstarCategory")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function loadFromMorningstar(option, id) {
  var doc = fetchMorningstar(id);

  if(option == "nav")
    return processNav(getNavFromMorningstar(doc));
  if(option == "date")
    return processDate(getDateFromMorningstar(doc));
  if(option == "change")
    return processChange(getChangeFromMorningstar(doc));
  if(option == "currency")
    return processCurrency(getCurrencyFromMorningstar(doc));
  if(option == "expenses")
    return processExpenses(getExpensesFromMorningstar(doc));
  if(option == "category")
    return processCategory(getCategoryFromMorningstar(doc));
  if(option == "source")
    return processSource("morningstar");
}
