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
  try {
    const validOptions = ['nav', 'date', 'change', 'currency', 'expenses', 'category'];

    if (!validOptions.includes(option)) {
      throw UnknownOptionError();
    }

    if (!id) {
      throw EmptyAssetIdentifierError();
    }

    if (source === "" || source === undefined || source === null || /^morningstar(-(au|es|de|ie|fr|za|at|be|dk|fi|gb|uk|ch|is|it|pt|no|nl))?$/.test(source)) {
      return loadFromMorningstar(option, id);
    }

    if (source == "quefondos") {
      return loadFromQuefondos(option, id);
    }

    throw UnknownSourceError();
  }
  catch (error) {
    Logger.severe({
      message: error.message,
      context: {
        option: option,
        id: id,
        source: source,
        stack: error.stack,
      },
    });

    throw error;
  }
}
