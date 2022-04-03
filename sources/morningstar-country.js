// Given a 2-letter country code, returns the base URL for a Morningstar website
function getMorningstarCountryBase(country) {
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
    return "https://www.morningstar.is/is";
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

// Given a 2-letter country code, returns the location for funds snapshots
function getMorningstarCountryLink(country) {
  if(country == "au")
    return "/Funds/FundReportPrint/";
  return "/funds/snapshot/snapshot.aspx?id=";
}

function getMorningstarCountrySearchLink(country) {
  return "/funds/SecuritySearchResults.aspx?search=";
}

function getMorningstarCountrySearchResultClass(country) {
  return "searchLink";
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
  var cache = CacheService.getScriptCache();
  var cached = cache.get("mf-msid-" + id);

  if (cached != null && cached != -1) { 
    return cached;
  } else {
    if (country == "au") {
      try {
        var url = getMorningstarCountryBase(country) + "/Ausearch/SecurityCodeAutoLookup?rows=20000&fq=SecurityTypeId:(1+OR+2+OR+3+OR+4+OR+5)&sort=UniverseSort+asc&q=" + id;
        var fetch = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});
        var json = fetch.getContentText();
        var data = JSON.parse(json);
        var res = data["hits"]["hits"][0]["_source"]["Symbol"];
        cache.put("mf-msid-" + id, res, 999999999);
        return res;
      }
      catch(error) {
        throw new Error("This asset is not compatible with this Morningstar country. Try another country or data source");
      }
    } else {
      var fetch = UrlFetchApp.fetch(getMorningstarCountryBase(country) + getMorningstarCountrySearchLink(country) + id);
      if(fetch.getResponseCode() == 200 && fetch.getContent().length > 0) {
        var xmlstr = fetch.getContentText()
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
                        .replace("xml:space", "space")
                        .replace("xmlns:", "")
                        .replace("ns0:", "")
                        .replace(/<svg(.*)<\/svg>/gm, '');
        var doc = Xml.parse(xmlstr, true);
        var bodyHtml = doc.html.body;
        if(country == "uk" || country == "gb") bodyHtml = bodyHtml[2];
        bodyHtml = bodyHtml.toXmlString();
        doc = XmlService.parse(bodyHtml).getRootElement();
        var links = getElementsByClassName(doc, getMorningstarCountrySearchResultClass(country));
        if(links.length > 0) {
          var msid = getMSIDFromMorningstarSearch(doc, links, country);
          cache.put("mf-msid-" + id, msid, 999999999);
          return msid;
        } else {
          cache.put("mf-msid-" + id, -1, 999999999);
          throw new Error("This asset is not compatible with this Morningstar country. Try another country or data source");
        }
      }
    }
  }
}

// Given an asset's identifier, returns related country
function getMorningstarCountryFromAsset(id, country) {
  var cache = CacheService.getScriptCache();
  // First, if the identifier is a ISIN, extract it from there
  if(isISIN(id)) {
    return id.substr(0, 2).toLowerCase();
  }

  // Otherwise, if country is introduced by user, then save it for cache
  if(country) {
    cache.put("mf-country-" + id, country, 999999999);
    return country;
  }

  // If country is not defined or obtained via ISIN, then try cache or ask user
  var cached = cache.get("mf-country-" + id);
  if (cached != null)
    return cached;
  else
    throw new Error("ISIN country is not compatible with Morningstar. Please try another compatible data source");
}

function getMSIDFromMorningstarSearch(doc, links, country) {
  if(country == "au")
    return getElementsByTagName(links[0], "a")[0].asElement().getAttribute("href").getValue().substr(18);
  return getElementsByTagName(links[0], "a")[0].asElement().getAttribute("href").getValue().substr(-10);
}

function getNavFromMorningstarCountry(doc, country) {
  if(country == "au") {
    var row = getElementsByTagName(getElementsByTagName(doc, "table")[9], "td")[7].getValue();
    return row.substr(row.indexOf('$')+1);
  } else
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[0].getValue().substr(4).replace(',', '.');
}

function getDateFromMorningstarCountry(doc, country) {
  if(country == "au")
    return getElementsByTagName(getElementsByTagName(doc, "table")[9], "td")[1].getValue().substr(6);
  else
    return getElementsByClassName(getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "heading")[0], "heading")[0].getValue();
}

function getChangeFromMorningstarCountry(doc, country) {
  if(country == "au") {
    var nav = getNavFromMorningstarCountry(doc, country);
    var row = getElementsByTagName(getElementsByTagName(doc, "table")[9], "td")[8].getValue();
    var change = row.substr(row.indexOf('$')+1);
    if(!isNaN(parseFloat(nav)) && isFinite(nav) && !isNaN(parseFloat(change)) && isFinite(change) && nav > 0) {
      change = parseFloat(change)/parseFloat(nav)*100;
      return change.toString();
    } else
      throw new Error("Last change is not available for this asset and source. Please try another data source");
  } else
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[1].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '').replace(',', '.');
}

function getCurrencyFromMorningstarCountry(doc, country) {
  if(country == "au") return "AUD";
  return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[0].getValue().substr(0, 3);
}

function getExpensesFromMorningstarCountry(doc, country) {
  if(country == "au")
    return getElementsByTagName(getElementsByTagName(doc, "table")[11], "td")[12].getValue();
  else if(country == "de")
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[9].getValue().replace(',', '.');
  else if(country == "uk" || country == "gb") {
    var rows = getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text");
    return rows[rows.length-1].getValue().replace(',', '.');
  } else if(country == "nl" || country == "dk" || country == "ch" || country == "it")
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[8].getValue().replace(',', '.');
  else
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[7].getValue().replace(',', '.');
}

function getCategoryFromMorningstarCountry(doc, country) {
  if(country == "au") {
    var row = getElementsByTagName(getElementsByTagName(doc, "table")[9], "td")[5].getValue();
    return row.slice(row.indexOf('Category')+9, -21);
  } else if(country == "de")
    return getElementsByTagName(getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[3], "a")[0].getValue();
  else if(country == "dk")
    return getElementsByTagName(getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[4], "a")[0].getValue();
  else
    return getElementsByTagName(getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[2], "a")[0].getValue();
}

function fetchMorningstarCountry(id, country) {
  var url = getMorningstarCountryBase(country) + getMorningstarCountryLink(country) + id;
  var doc;
  if(country == "gb" || country == "uk")
    doc = fetchURL(url, "morningstar-" + country + "-" + id, 2);
  else
    doc = fetchURL(url, "morningstar-" + country + "-" + id);
  return doc;
}

function loadFromMorningstarCountry(option, id, country) {
  const msid = searchForMSID(id, country);
  const doc = fetchMorningstarCountry(msid, country);

  if (option == "nav")
    return processNav(getNavFromMorningstarCountry(doc, country));
  if (option == "date")
    return processDate(getDateFromMorningstarCountry(doc, country));
  if (option == "change")
    return processChange(getChangeFromMorningstarCountry(doc, country));
  if (option == "currency")
    return processCurrency(getCurrencyFromMorningstarCountry(doc, country));
  if (option == "expenses")
    return processExpenses(getExpensesFromMorningstarCountry(doc, country));
  if (option == "category")
    return processCategory(getCategoryFromMorningstarCountry(doc, country));
  if (option == "source")
    return processSource("morningstar-" + country);
}
