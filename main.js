/* ------------------- Main function -------------------- */

/**
 * Imports mutual fund NAV or other data from Morningstar. See complete documentation at mufunds.com.
 *
 * @param {string} option Asset attribute: nav, date, change, currency, expenses or category.
 * @param {string} id Asset identifier (ISIN, ticker or Morningstar ID).
 * @param {string} source Source from which obtain the data (check documentation).
 * @return The asked information from the fund, according to the selected source.
 * @customfunction
 */

function muFunds(option, id, source) {
  // First, check if option is valid
  if (!(option == "nav" || option == "date" || option == "change" || option == "currency" || option == "expenses" || option == "category" || option == "source")) {
    throw new Error( "You have selected an invalid option." );
  }

  if (!id) {
    throw new Error( "Asset identifier is empty." );
  }

  if (!source) {
    throw new Error( "Data source is required as third argument. Please see www.mufunds.com/usage.html" );
  }

  // Input already validated
  if (source == "morningstar-au" || source == "morningstar-es" || source == "morningstar-de" || source == "morningstar-ie" || source == "morningstar-fr" || source == "morningstar-za" || source == "morningstar-at" || source == "morningstar-be" || source == "morningstar-dk" || source == "morningstar-fi" || source == "morningstar-gb" || source == "morningstar-uk" || source == "morningstar-ch" || source == "morningstar-is" || source == "morningstar-it" || source == "morningstar-pt" || source == "morningstar-no" || source == "morningstar-nl") {
    var country = source.substr(12, 2).toLowerCase();
    return loadFromMorningstar(option, id, country);
  }

  if (source == "quefondos") {
    return loadFromQuefondos(option, id);
  }

  // If no compatible source is chosen, return error
  throw new Error( "Source is not compatible. Please check the documentation for the compatibility list" );
}

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
