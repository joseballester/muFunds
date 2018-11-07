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

/* ----------- Data processing functions ----------- */
function isISIN(id) {
  // ISIN have 12 characters
  // Not the most robust way (TODO: improve it)
  return id.length == 12;
}

function processNav(nav) {
  nav = nav.replace(',', '.');
  if(!isNaN(parseFloat(nav)) && isFinite(nav))
    return parseFloat(nav);
  else
    throw new Error("NAV is not available for this asset and source. Please try another data source");
}

function processDate(date) {
  return date;
}

function processChange(change) {
  change = change.replace(',', '.').replace('%', '');
  if(!isNaN(parseFloat(change)) && isFinite(change))
    return parseFloat(change)/100;
  else
    throw new Error("Last change is not available for this asset and source. Please try another data source");
}

function processCurrency(currency) {
  return currency;
}

function processExpenses(expenses) {
  expenses = expenses.replace(',', '.').replace('%', '');
  if(!isNaN(parseFloat(expenses)) && isFinite(expenses))
    return parseFloat(expenses)/100;
  else
    throw new Error("Expenses ratio is not available for this asset and source. Please try another data source");
}

function processCategory(category) {
  return category;
}

function processSource(source) {
  return source;
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
      var xmlstr = fetch.getContentText()
                        .replace(/<script.*>/, "<script>//<![CDATA[")
                        .replace(" </script>", "//]]></script>");
      var doc = Xml.parse(xmlstr, true);
      var body = doc.html.body;
      var bodyHtml = (body.length > 1 ? body[1].toXmlString() : body.toXmlString());
      cache.put(cacheid, bodyHtml, 7200);
      return XmlService.parse(bodyHtml).getRootElement();
    } else {
      throw new Error("Wrong combination of asset identifier and source. Please check the accepted ones at the documentation");
    }
  }
}
