function fetchQuefondos(id) {
  return fetchURL('https://www.quefondos.com/es/fondos/ficha/index.html?isin=' + id);
}

function fetchQuefondosPP(id) {
  return fetchURL('https://www.quefondos.com/es/planes/ficha/index.html?isin=' + id);
}

function getNavFromQuefondos(doc) {
  const $ = Cheerio.load(doc);
  const nav = $(".informe:eq(0)").find(".w100:eq(1)").find(".floatright:eq(0)").text();
  return nav.substr(0, nav.length-4);
}

function getDateFromQuefondos(doc) {
  const $ = Cheerio.load(doc);
  return $(".informe:eq(0)").find(".w100:eq(1)").find(".floatright:eq(2)").text();
}

function getChangeFromQuefondos(doc) {
  const $ = Cheerio.load(doc);
  return $(".informe:eq(0)").find(".w100:eq(1)").find(".floatright:eq(3)").text();
}

function getCurrencyFromQuefondos(doc) {
  const $ = Cheerio.load(doc);
  return $(".informe:eq(0)").find(".w100:eq(1)").find(".floatright:eq(0)").text().substr(-3);
}

function getExpensesFromQuefondos(doc) {
  throw new Error("Expenses ratio is not available from this source");
}

function getCategoryFromQuefondos(doc) {
  const $ = Cheerio.load(doc);
  return $(".informe:eq(0)").find(".common:eq(0)").find(".floatright:eq(1)").text();
}

function loadFromQuefondos(option, id) {
  // Quefondos only reports for mutual funds and pension plans
  const doc = (isISIN(id) ? fetchQuefondos(id) : fetchQuefondosPP(id));

  if (option == "nav")
    return processNav(getNavFromQuefondos(doc));
  if (option == "date")
    return processDate(getDateFromQuefondos(doc));
  if (option == "change")
    return processChange(getChangeFromQuefondos(doc));
  if (option == "currency")
    return processCurrency(getCurrencyFromQuefondos(doc));
  if (option == "expenses")
    return processExpenses(getExpensesFromQuefondos(doc));
  if (option == "category")
    return processCategory(getCategoryFromQuefondos(doc));
  if (option == "source")
    return processSource("quefondos");
}
