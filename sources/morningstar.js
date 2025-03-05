// Given a 2-letter country code, returns the base URL for a Morningstar website
function getMorningstarBase(country) {
  if(country == "au")
    return "https://www.morningstar.com.au";
  if(country == "es")
    return "https://www.morningstar.es/es";
  if(country == "de")
    return "https://www.morningstar.de/de";
  if(country == "ie")
    return "https://www.morningstarfunds.ie/ie";
  if(country == "fr")
    return "https://www.morningstar.fr/fr";
  if(country == "za")
    return "https://www.morningstar.co.za/za";
  if(country == "at")
    return "https://www.morningstar.at/at";
  if(country == "be")
    return "https://www.morningstar.be/be";
  if(country == "dk")
    return "https://www.morningstar.dk/dk";
  if(country == "fi")
    return "https://www.morningstar.fi/fi";
  if(country == "gb" || country == "uk")
    return "https://www.morningstar.co.uk/uk";
  if(country == "ch")
    return "https://www.morningstar.ch/ch";
  if(country == "is")
    return "http://www.morningstar.is/is";
  if(country == "it")
    return "https://www.morningstar.it/it";
  if(country == "pt")
    return "https://www.morningstar.pt/pt";
  if(country == "no")
    return "https://www.morningstar.no/no";
  if(country == "nl")
    return "https://www.morningstar.nl/nl";
  // As a previous filter has been done, if a user arrives here it is because
  // it comes from failed generic Morningstar and asset country has been searched
  else
    throw new Error("This option is not available for the given asset");
}

// Given a 2-letter country code, returns the location for a given fund MSID
function getMorningstarLink(country, id) {
  if (country == "au") {
    return getMorningstarBase(country) + "/Funds/FundReportPrint/" + id;
  } else {
    return getMorningstarBase(country) + "/funds/snapshot/snapshot.aspx?id=" + id;
  }
}

function getMorningstarSearchLink(country, id) {
  if (country == "au") {
    return  getMorningstarBase(country) + "/Ausearch/SecurityCodeAutoLookup?rows=20000&fq=SecurityTypeId:(1+OR+2+OR+3+OR+4+OR+5)&sort=UniverseSort+asc&q=" + id;
  } else {
    return  getMorningstarBase(country) + "/funds/SecuritySearchResults.aspx?search=" + id;
  }
}

// Returns if an asset's identifier is an asset's Morningstar ID
function isMSID(id) {
  // Morningstar IDs have 10 chars, ISIN have 12
  // Not the most robust way (TODO: improve it)
  return id.length == 10;
}

// Given an asset's identifier and a Morningstar version, searches for the asset's Morningstar ID
function searchForMSID(id, country) {
  // If the identifier is actually a Morningstar ID, then return it
  if (isMSID(id)) return id;

  // Checks if there is a cached version
  const cache = CacheService.getScriptCache();
  const cached = cache.get("mf-msid-" + id);
  if (cached !== null) { 
    return cached;
  }

  if (country == "au") {
    try {
      const url = getMorningstarSearchLink(country, id);
      const fetch = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});
      const json = fetch.getContentText();
      const data = JSON.parse(json);
      const res = data["hits"]["hits"][0]["_source"]["Symbol"];
      cache.put("mf-msid-" + id, res, 999999999);
      return res;
    } catch(error) {
      throw new Error("This asset is not compatible with this Morningstar country. Try another country or data source.");
    }
  } else {
    const url = getMorningstarSearchLink(country, id);
    const fetch = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});
    if (fetch.getResponseCode() == 200 && fetch.getContent().length > 0) {
      const pageBody = fetch.getContentText();
      const $ = Cheerio.load(pageBody);
      const element = $(".searchLink:eq(0)").find("a").attr("href");
      if (element) {
        const msid = element.substr(-10);
        cache.put("mf-msid-" + id, msid, 999999999);
        return msid;
      }
    }
    throw new Error("This asset is not compatible with this Morningstar country. Try another country or data source.");
  }
}

function getNavFromMorningstar(doc, country) {
  const $ = Cheerio.load(doc);
  if (country == "au") {
    const text = $("table:eq(9)").find("td:eq(7)").text();
    const value = text.substr(text.indexOf('$')+1);
    return value;
  } else {
    const text = $(".overviewKeyStatsTable:eq(0)").find(".text:eq(0)").text();
    const value = text.substr(4);
    return value;
  }
}

function getDateFromMorningstar(doc, country) {
  const $ = Cheerio.load(doc);
  if (country == "au") {
    const text = $("table:eq(9)").find("td:eq(1)").text();
    const value = text.substr(6);
    return value;
  } else {
    const text = $(".overviewKeyStatsTable:eq(0)").find(".heading:eq(0)").find(".heading:eq(0)").text();
    const value = text;
    return value;
  }
}

function getChangeFromMorningstar(doc, country) {
  const $ = Cheerio.load(doc);
  if (country == "au") {
    const nav = getNavFromMorningstar(doc, country);

    const text = $("table:eq(9)").find("td:eq(8)").text();
    var change = text.substr(text.indexOf('$')+1);
    if (!isNaN(parseFloat(nav)) && isFinite(nav) && !isNaN(parseFloat(change)) && isFinite(change) && nav > 0) {
      change = parseFloat(change)/parseFloat(nav)*100;
      return change.toString();
    } else {
      throw new Error("Last change is not available for this asset and source. Please try another data source");
    }
  } else {
    const text = $(".overviewKeyStatsTable:eq(0)").find(".text:eq(1)").text();
    const value = text.replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
    return value;
  }
}

function getCurrencyFromMorningstar(doc, country) {
  const $ = Cheerio.load(doc);
  if (country == "au") {
    return "AUD";
  } else {
    const text = $(".overviewKeyStatsTable:eq(0)").find(".text:eq(0)").text();
    const value = text.substr(0, 3);
    return value;
  }
}

function getExpensesFromMorningstar(doc, country) {
  const $ = Cheerio.load(doc);
  if (country == "au") {
    return $("table:eq(11)").find("td:eq(12)").text();
  } else if (country == "de" || country == "dk") {
    return $(".overviewKeyStatsTable:eq(0)").find(".text:eq(9)").text();
  } else if (country == "uk" || country == "gb") {
    return $(".overviewKeyStatsTable:eq(0)").find(".text:last").text();
  } else if (country == "nl" || country == "ch" || country == "it") {
    return $(".overviewKeyStatsTable:eq(0)").find(".text:eq(8)").text();
  } else {
    return $(".overviewKeyStatsTable:eq(0)").find(".text:eq(7)").text();
  }
}

function getCategoryFromMorningstar(doc, country) {
  const $ = Cheerio.load(doc);
  if (country == "au") {
    const row = $("table:eq(9)").find("td:eq(5)").text();
    return row.slice(row.indexOf('Category')+9, -21);
  } else if (country == "de") {
    return $(".overviewKeyStatsTable:eq(0)").find(".text:eq(3)").find("a:eq(0)").text();
  } else if (country == "dk") {
    return $(".overviewKeyStatsTable:eq(0)").find(".text:eq(4)").find("a:eq(0)").text();
  } else {
    return $(".overviewKeyStatsTable:eq(0)").find(".text:eq(2)").find("a:eq(0)").text();
  }
}

function fetchMorningstar(id, country) {
  const url = getMorningstarLink(country, id);

  const cacheid = !['gb', 'uk'].includes(country)
    ? "morningstar-" + country + "-" + id
    : null;

  const doc = fetchURL(url, cacheid);
  
  return doc;
}

function loadFromMorningstar(option, id, country) {
  const msid = searchForMSID(id, country);
  const doc = fetchMorningstar(msid, country);

  if (option == "nav")
    return processNav(getNavFromMorningstar(doc, country));
  if (option == "date")
    return processDate(getDateFromMorningstar(doc, country));
  if (option == "change")
    return processChange(getChangeFromMorningstar(doc, country));
  if (option == "currency")
    return processCurrency(getCurrencyFromMorningstar(doc, country));
  if (option == "expenses")
    return processExpenses(getExpensesFromMorningstar(doc, country));
  if (option == "category")
    return processCategory(getCategoryFromMorningstar(doc, country));
  if (option == "source")
    return processSource("morningstar-" + country);
}
