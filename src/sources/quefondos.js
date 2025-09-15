function loadFromQuefondos(option, id) {
  const url = isISIN(id) 
    ? `https://www.quefondos.com/es/fondos/ficha/index.html?isin=${id}` 
    : `https://www.quefondos.com/es/planes/ficha/index.html?isin=${id}`;

  const fetch = UrlFetchApp.fetch(url);
  if (fetch.getResponseCode() !== 200 || fetch.getContent().length === 0) {
    throw new Error('Wrong combination of asset identifier and source. Please check the accepted ones at the documentation.');
  }

  const html = fetch.getContentText();
  const $ = Cheerio.load(html);

  switch (option) {
    case 'nav':
      const navStr = $('.informe:eq(0)').find('.w100:eq(1)').find('.floatright:eq(0)').text();
      return processNav(navStr.substring(0, navStr.length-4));

    case 'date':
      return processDate($('.informe:eq(0)').find('.w100:eq(1)').find('.floatright:eq(2)').text());

    case 'change':
      return processChange($('.informe:eq(0)').find('.w100:eq(1)').find('.floatright:eq(3)').text());

    case 'currency':
      const currencyStr = $('.informe:eq(0)').find('.w100:eq(1)').find('.floatright:eq(0)').text();
      return processCurrency(currencyStr.substring(currencyStr.length-3));

    case 'expenses':
      throw new Error('Expenses ratio is not available from this source');

    case 'category':
      return processCategory($('.informe:eq(0)').find('.common:eq(0)').find('.floatright:eq(1)').text());

    default:
      throw new Error('You have selected an invalid option.');
  }
}
