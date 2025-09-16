function loadFromQuefondos(option, id) {
  const url = isISIN(id) 
    ? `https://www.quefondos.com/es/fondos/ficha/index.html?isin=${id}` 
    : `https://www.quefondos.com/es/planes/ficha/index.html?isin=${id}`;

  const fetch = UrlFetchApp.fetch(url);
  if (fetch.getResponseCode() !== 200 || fetch.getContent().length === 0) {
    throw AssetNotFoundError();
  }

  const html = fetch.getContentText();
  const $ = Cheerio.load(html);

  if (option === 'nav') {
    const navStr = $('.informe:eq(0)').find('.w100:eq(1)').find('.floatright:eq(0)').text();
    return processNav(navStr.substring(0, navStr.length-4));
  }

  if (option === 'date') {
    return processDate($('.informe:eq(0)').find('.w100:eq(1)').find('.floatright:eq(2)').text());
  }

  if (option === 'change') {
    return processChange($('.informe:eq(0)').find('.w100:eq(1)').find('.floatright:eq(3)').text());
  }

  if (option === 'currency') {
    const currencyStr = $('.informe:eq(0)').find('.w100:eq(1)').find('.floatright:eq(0)').text();
    return processCurrency(currencyStr.substring(currencyStr.length-3));
  }
  
  if (option === 'category') {
    return processCategory($('.informe:eq(0)').find('.common:eq(0)').find('.floatright:eq(1)').text());
  }

  throw DataNotAvailableError();
}
