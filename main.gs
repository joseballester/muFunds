/* ----------- Google Sheets add-on functions ----------- */

// Adds "About µFunds" menu
function onOpen(e) {
  SpreadsheetApp.getUi().createAddonMenu()
      .addItem('About µFunds', 'showAbout')
      .addToUi();
}

// Installation
function onInstall(e) {
  onOpen(e);
}

// Opens "About µFunds" page
function showAbout() {
  var ui = HtmlService.createHtmlOutputFromFile('about')
      .setTitle('About µFunds');
  SpreadsheetApp.getUi().showSidebar(ui);
}


/* ------------------- Main function -------------------- */

/**
 * Imports mutual fund NAV or other data from Morningstar. See complete documentation at mufunds.com.
 *
 * @param {string} option Asset attribute: nav, date, change, currency, expenses or category.
 * @param {string} id Asset identifier (ISIN, ticker or Morningstar ID).
 * @param {string} country (optional) Country where the asset is available. Including or excluding this parameter may lead to more accurate results.
 * @return The asked information from the fund.
 * @customfunction
 */

function muFunds(option, id, country) {
  // First, check if option is valid
  if(!(option == "nav" || option == "date" || option == "change" || option == "currency" || option == "expenses" || option == "category")) {
    throw new Error( "You have selected an invalid option." );
    return;
  }
  if(!id) {
    throw new Error( "Asset identifier is empty." );
    return;
  }

  // Load data from generic quote if possible
  return loadFromQuote(option, id, country);
}

/* ------------ Data loading functions ------------- */

function loadFromQuote(option, id, country) {
  // If a country is explictly chosen by the user, load from its snapshot
  if(country)
    return loadFromSnapshot(option, id, country);

  // Otherwise, go for quote
  var doc = fetchQuote(id);

  var nav = getNavFromQuote(doc);
  var date = getDateFromQuote(doc);
  var change = getChangeFromQuote(doc);
  var currency = getCurrencyFromQuote(doc);
  var expenses = getExpensesFromQuote(doc);
  var category = getCategoryFromQuote(doc);

  // Check that all data is correct
  if(!isNaN(parseFloat(nav)) && isFinite(nav) && date.length > 2 && change.length > 2 && currency.length == 3 && category.length > 2) {
    if(option == "nav")
      return parseFloat(nav);
    if(option == "date")
      return date;
    if(option == "change")
      return parseFloat(change)/100;
    if(option == "currency")
      return currency;
    if(option == "expenses")
      return (!isNaN(parseFloat(expenses)) ? parseFloat(expenses)/100 : expenses);
    if(option == "category")
      return category;
  } else {
      // Asset is not compatible with generic mode, try from snapshot
      return loadFromSnapshot(option, id);
  }
}


function loadFromSnapshot(option, id, country) {
  // Call can come: (a) country is defined, go for it
  //             or (b) loadFromQuote failed, then country has to be found

  country = getCountryFromAsset(id, country);

  // If no cached version exists, then obtain it
  var base = getMorningstarBase(country);
  var msid = searchForMSID(id, country);

  var doc = fetchSnapshot(msid, country);
  try {
    // Parse data from fetched HTML
    var nav = getNavFromSnapshot(doc, country);
    var date = getDateFromSnapshot(doc, country);
    var change = getChangeFromSnapshot(doc, country);
    var currency = getCurrencyFromSnapshot(doc, country);
    var expenses = getExpensesFromSnapshot(doc, country);
    var category = getCategoryFromSnapshot(doc, country);
  }
  catch (error) {
    throw new Error("Wrong asset or country. Please check if the asset is available for sale in the chosen country");
  }
  // Check that all data is correct
  if(!isNaN(parseFloat(nav)) && isFinite(nav) && date.length > 2 && currency.length == 3) {
    if(option == "nav")
      return parseFloat(nav);
    if(option == "date")
      return date;
    if(option == "change")
      return parseFloat(change)/100;
    if(option == "currency")
      return currency;
    if(option == "expenses")
      return (!isNaN(parseFloat(expenses)) ? parseFloat(expenses)/100 : expenses);
    if(option == "category")
      return category;
  } else {
    throw new Error("Data is not available for this asset");
  }
}
