// Sheets only finds custom functions declared at the top level of a script file,
// so this file is appended as-is to the bundle, after the `MuFunds` global.

/**
 * Imports mutual fund NAV or other data from Morningstar. See complete documentation at mufunds.com.
 *
 * @param {string} option Asset attribute: nav, date, change, currency, expenses, category, return1d, return1m, return3m, return1y, return3y, return5y or returnytd.
 * @param {string} id Asset identifier (ISIN, ticker or Morningstar ID).
 * @param {string} source Source from which obtain the data: morningstar (default) or quefondos.
 * @return The asked information from the fund, according to the selected source.
 * @customfunction
 */
function muFunds(option, id, source) {
  return MuFunds.muFunds(option, id, source);
}
