/* ----------- HTML Parsing functions ----------- */

// Returns elements with a certain attribute
function getElementsByAttribute(element, attribute, classToFind) {
  var data = [];
  var descendants = element.getDescendants();
  descendants.push(element);
  for(i in descendants) {
    var elt = descendants[i].asElement();
    if(elt != null) {
      var classes = elt.getAttribute(attribute);
      if(classes != null) {
        classes = classes.getValue();
        if(classes == classToFind) data.push(elt);
        else {
          classes = classes.split(' ');
          for(j in classes) {
            if(classes[j] == classToFind) {
              data.push(elt);
              break;
            }
          }
        }
      }
    }
  }
  return data;
}

// Returns elements with a certain class
function getElementsByClassName(element, classToFind) {
  var data = [];
  var descendants = element.getDescendants();
  descendants.push(element);
  for(i in descendants) {
    var elt = descendants[i].asElement();
    if(elt != null) {
      var classes = elt.getAttribute('class');
      if(classes != null) {
        classes = classes.getValue();
        if(classes == classToFind) data.push(elt);
        else {
          classes = classes.split(' ');
          for(j in classes) {
            if(classes[j] == classToFind) {
              data.push(elt);
              break;
            }
          }
        }
      }
    }
  }
  return data;
}

// Returns elements with a certain tag name
function getElementsByTagName(element, tagName) {
  var data = [];
  var descendants = element.getDescendants();
  for(i in descendants) {
    var elt = descendants[i].asElement();
    if( elt !=null && elt.getName()== tagName) data.push(elt);
  }
  return data;
}

/* ------------- Morningstar auxiliary functions ------------- */

// Given a 2-letter country code, returns the base URL for a Morningstar website
function getMorningstarBase(country) {
  if(country == "au")
    return "https://www.morningstar.com.au";
  if(country == "es")
    return "http://www.morningstar.es/es";
  if(country == "de")
    return "http://www.morningstar.de/de";
  if(country == "ie")
    return "http://www.morningstarfunds.ie/ie";
  if(country == "fr")
    return "http://www.morningstar.fr/fr";
  if(country == "za")
    return "http://www.morningstar.co.za/za";
  if(country == "at")
    return "http://www.morningstar.at/at";
  if(country == "be")
    return "http://www.morningstar.be/be";
  if(country == "dk")
    return "http://www.morningstar.dk/dk";
  if(country == "fi")
    return "http://www.morningstar.fi/fi";
  if(country == "gb" || country == "uk")
    return "http://www.morningstar.co.uk/uk";
  if(country == "ch")
    return "http://www.morningstar.ch/ch";
  if(country == "is")
    return "http://www.morningstar.is/is";
  if(country == "it")
    return "http://www.morningstar.it/it";
  if(country == "pt")
    return "http://www.morningstar.pt/pt";
  if(country == "no")
    return "http://www.morningstar.no/no";
  if(country == "nl")
    return "http://www.morningstar.nl/nl";
  else
    throw new Error("Asset country is not compatible");
}

// Given a 2-letter country code, returns the location for funds snapshots
function getSnapshotLink(country) {
  if(country == "au")
    return "/Funds/FundReportPrint/";
  return "/funds/snapshot/snapshot.aspx?id=";
}

function getSearchLink(country) {
  return "/funds/SecuritySearchResults.aspx?search=";
}

function getSearchResultClass(country) {
  return "searchLink";
}

// Returns if an asset's identifier is an asset's Morningstar ID
function isMSID(id) {
  // Morningstar IDs have 10 chars, ISIN have 12
  // Not the most robust way (TODO: improve it)
  return id.length == 10;
}

// Returns if an asset's identifier is an ISIN
function isISIN(id) {
  // Morningstar IDs have 10 chars, ISIN have 12
  // Not the most robust way (TODO: improve it)
  return id.length == 12;
}

// Given an asset's identifier and a Morningstar version, searches for the asset's Morningstar ID
function searchForMSID(id, country) {
  // If the identifier is actually a Morningstar ID, then return it
  if(isMSID(id)) return id;

  // Checks if there is a cached version
  var cache = CacheService.getScriptCache();
  var cached = cache.get("mf-msid-" + id);
  if (cached != null) {
    if (cached != -1)
      return cached;
    else {
      // Asset not found previously
      throw new Error("This asset is not compatible with µFunds.");
    }
  } else {
    if(country == "au") {
      try {
        var url = getMorningstarBase(country) + "/Ausearch/SecurityCodeAutoLookup?rows=20000&fq=SecurityTypeId:(1+OR+2+OR+3+OR+4+OR+5)&sort=UniverseSort+asc&q=" + id;
        var fetch = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});
        var json = fetch.getContentText();
        var data = JSON.parse(json);
        var res = data["response"]["docs"][0]["Symbol"];
        cache.put("mf-msid-" + id, res, 999999999);
        return res;
      }
      catch(error) {
        cache.put("mf-msid-" + id, -1, 999999999);
        throw new Error("This asset is not compatible with µFunds.");
      }
    } else {
      var fetch = UrlFetchApp.fetch(getMorningstarBase(country) + getSearchLink(country) + id);
      if(fetch.getResponseCode() == 200 && fetch.getContent().length > 0) {
        var doc = Xml.parse(fetch, true);
        var bodyHtml = doc.html.body.toXmlString();
        doc = XmlService.parse(bodyHtml).getRootElement();
        var links = getElementsByClassName(doc, getSearchResultClass(country));
        if(links.length > 0) {
          var msid = getMSIDFromSearch(doc, links, country);
          cache.put("mf-msid-" + id, msid, 999999999);
          return msid;
        } else {
          cache.put("mf-msid-" + id, -1, 999999999);
          throw new Error("This asset is not compatible with µFunds.");
        }
      }
    }
  }
}

// Given an asset's identifier, returns related country
function getCountryFromAsset(id, country) {
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
    throw new Error("Please introduce your 2-letter country code as a third argument of the function call.");
}

function getMSIDFromSearch(doc, links, country) {
  if(country == "au")
    return getElementsByTagName(links[0], "a")[0].asElement().getAttribute("href").getValue().substr(18);
  return getElementsByTagName(links[0], "a")[0].asElement().getAttribute("href").getValue().substr(-10);
}

/* -------- Fetching cached/non-cached pages -------- */
function fetchURL(url, cacheid) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheid);
  if(cached != null) {
    return XmlService.parse(cached).getRootElement();
  } else {
    var fetch = UrlFetchApp.fetch(url);
    if(fetch.getResponseCode() == 200 && fetch.getContent().length > 0) {
      var doc = Xml.parse(fetch, true);
      var bodyHtml = doc.html.body.toXmlString();
      cache.put(cacheid, bodyHtml, 7200);
      return XmlService.parse(bodyHtml).getRootElement();
    } else {
      throw new Error("Wrong asset identifier. Please check the accepted asset identifiers at the documentation");
    }
  }
}

function fetchQuote(id) {
  return fetchURL('http://quotes.morningstar.com/fund/c-header?t=' + id, "mf-quote-" + id);
}

function fetchSnapshot(id, country) {
  return fetchURL(getMorningstarBase(country) + getSnapshotLink(country) + id, "mf-snapshot-" + id + country);
}

/* ------------ Specific Morningstar parsing functions ------------- */
function getNavFromQuote(doc) {
  return getElementsByAttribute(doc, 'vkey', "NAV")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getDateFromQuote(doc) {
  return getElementsByAttribute(doc, 'vkey', "LastDate")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getChangeFromQuote(doc) {
  return getElementsByAttribute(doc, 'vkey', "DayChange")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getCurrencyFromQuote(doc) {
  return getElementsByAttribute(doc, 'vkey', "PriceCurrency")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getExpensesFromQuote(doc) {
  return getElementsByAttribute(doc, 'vkey', "ExpenseRatio")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getCategoryFromQuote(doc) {
  return getElementsByAttribute(doc, 'vkey', "MorningstarCategory")[0].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '');
}

function getNavFromSnapshot(doc, country) {
  if(country == "au")
    return getElementsByClassName(getElementsByClassName(doc, "YMWTableSmall")[8], "YMWpadright")[5].getValue();
  else
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[0].getValue().substr(4).replace(',', '.');
}

function getDateFromSnapshot(doc, country) {
  if(country == "au")
    return getElementsByTagName(getElementsByClassName(doc, "YMWTableSmall")[8], "td")[1].getValue().substr(6);
  else
    return getElementsByClassName(getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "heading")[0], "heading")[0].getValue();
}

function getChangeFromSnapshot(doc, country) {
  if(country == "au") {
    var nav = getNavFromSnapshot(doc, country);
    var change = getElementsByClassName(getElementsByClassName(doc, "YMWTableSmall")[8], "YMWpadright")[6].getValue();
    if(!isNaN(parseFloat(nav)) && isFinite(nav) && !isNaN(parseFloat(change)) && isFinite(change) && nav > 0)
      return change/nav*100;
    else
      return "--";
  } else
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[1].getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '').replace(',', '.');
}

function getCurrencyFromSnapshot(doc, country) {
  if(country == "au") return "AUD";
  return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[0].getValue().substr(0, 3);
}

function getExpensesFromSnapshot(doc, country) {
  if(country == "au")
    return getElementsByClassName(getElementsByClassName(doc, "YMWTableSmall")[10], "YMWpadright")[3].getValue();
  else if(country == "de")
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[9].getValue().replace(',', '.');
  else if(country == "nl" || country == "dk")
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[8].getValue().replace(',', '.');
  else
    return getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[7].getValue().replace(',', '.');
}

function getCategoryFromSnapshot(doc, country) {
  if(country == "au")
    return getElementsByClassName(getElementsByClassName(doc, "YMWTableSmall")[8], "YMWpadright")[3].getValue();
  else if(country == "de")
    return getElementsByTagName(getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[3], "a")[0].getValue();
  else if(country == "dk")
    return getElementsByTagName(getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[4], "a")[0].getValue();
  else
    return getElementsByTagName(getElementsByClassName(getElementsByClassName(doc, "overviewKeyStatsTable")[0], "text")[2], "a")[0].getValue();
}
