function fetchQuefondos(id) {
  return fetchURL('https://www.quefondos.com/es/fondos/ficha/index.html?isin=' + id, "quefondos-pp-" + id);
}

function fetchQuefondosPP(id) {
  return fetchURL('https://www.quefondos.com/es/planes/ficha/index.html?isin=' + id, "quefondos-pp-" + id);
}

function getNavFromQuefondos(doc) {
  var nav = getElementsByClassName(getElementsByClassName(getElementsByClassName(doc, "informe")[0], "w100")[1], "floatright")[0].getValue();
  return nav.substr(0, nav.length-4).replace(",", ".");
}

function getDateFromQuefondos(doc) {
  return getElementsByClassName(getElementsByClassName(getElementsByClassName(doc, "informe")[0], "w100")[1], "floatright")[2].getValue();
}

function getChangeFromQuefondos(doc) {
  throw new Error("Last change is not available from this source");
}

function getCurrencyFromQuefondos(doc) {
  return getElementsByClassName(getElementsByClassName(getElementsByClassName(doc, "informe")[0], "w100")[1], "floatright")[0].getValue().substr(-3);
}

function getExpensesFromQuefondos(doc) {
  throw new Error("Expenses ratio is not available from this source");
}

function getCategoryFromQuefondos(doc) {
  return getElementsByClassName(getElementsByClassName(getElementsByClassName(doc, "informe")[0], "common")[0], "floatright")[1].getValue();
}

function loadFromQuefondos(option, id) {
  // Quefondos only reports for mutual funds and pension plans
  var doc = (isISIN(id) ? fetchQuefondos(id) : fetchQuefondosPP(id));

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
