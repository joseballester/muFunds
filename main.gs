/**
 * @OnlyCurrentDoc
 */

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

function onOpen(e) {
  SpreadsheetApp.getUi().createAddonMenu()
      .addItem('About µFunds', 'showAbout')
      .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showAbout() {
  var ui = HtmlService.createHtmlOutputFromFile('about')
      .setTitle('About µFunds');
  SpreadsheetApp.getUi().showSidebar(ui);
}

/**
 * Imports mutual fund NAV or other data from Morningstar.
 *
 * @param {string} option Fund attribute: nav, date, change, currency, expenses, category or style. 
 * @param {string} isin Fund ISIN, ticker or Morningstar ID.
 * @return The asked information from the fund.
 * @customfunction
 */

function muFunds(option, isin) {
  if(option == "nav" || option == "date" || option == "change" || option == "currency" || option == "expenses" || option == "category" || option == "style") {
    var fetch = UrlFetchApp.fetch('http://quotes.morningstar.com/fund/c-header?t=' + isin);
    if(fetch.getContent().length > 0) {
      // var html = fetch.getContentText().replace(/&/g, '&amp;').replace(/function (.*)(\n.*)*}\n/g, '');
      // var xml = '<root>' + html + '</root>';
      var doc = Xml.parse(fetch, true);
      var bodyHtml = doc.html.body.toXmlString();
      doc = XmlService.parse(bodyHtml).getRootElement();
      var attrval;
      if(option == "nav") attrval = "NAV";
      else if(option == "date") attrval = "LastDate";
      else if(option == "change") attrval = "DayChange";
      else if(option == "currency") attrval = "PriceCurrency";
      else if(option == "expenses") attrval = "ExpenseRatio";
      else if(option == "category") attrval = "MorningstarCategory";
      else if(option == "style") attrval = "InvestmentStyle";
      var fields = getElementsByAttribute(doc, 'vkey', attrval);
      if(fields.length > 0) {
        var field = getElementsByAttribute(doc, 'vkey', attrval)[0];
        var output = field.getValue().replace(/\s(\s+)/g, '').replace(/\n/g, '').replace(/\t/g, '') + (option == "change" ? "%" : "");
        if(option == "nav") return parseFloat(output);
        return output;
      } else return "--";
    } else {
      return "Wrong ISIN!";
    }
  } else {
    return "Wrong option!";
  }
}

