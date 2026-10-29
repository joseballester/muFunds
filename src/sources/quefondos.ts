import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';

import { HttpError, MuFundsError } from '../errors.ts';
import { annualize, cleanText, parseSpanishNumber, parseSpanishPercent } from '../parse.ts';
import type { AssetData, Services } from '../types.ts';

const FUND_URL = 'https://www.quefondos.com/es/fondos/ficha/index.html';
const PENSION_PLAN_URL = 'https://www.quefondos.com/es/planes/ficha/index.html';

/**
 * Scrapes a quefondos.com page. Funds are looked up by ISIN; anything else is
 * treated as a Spanish pension plan code (DGS code). Expense ratios aren't available.
 */
export function loadFromQuefondos(id: string, services: Services): AssetData {
  const baseUrl = isIsin(id) ? FUND_URL : PENSION_PLAN_URL;
  const url = `${baseUrl}?isin=${encodeURIComponent(id)}`;
  const { status, body } = services.fetch(url);

  if (status === 404 || (status === 200 && body.length === 0)) {
    throw new MuFundsError('ASSET_NOT_FOUND', {
      internalMessage: status === 404 ? 'Asset not found: HTTP 404' : 'Asset not found: empty page',
    });
  }
  if (status !== 200) {
    throw new HttpError(url, status);
  }

  const $ = services.loadHtml(body);
  const report = $('.informe').first();

  // Unknown codes still get a 200 page, with unfilled placeholders like "{ISIN}".
  if (report.length === 0 || $('title').text().includes('{ISIN}')) {
    throw new MuFundsError('ASSET_NOT_FOUND', {
      internalMessage: 'Asset not found: unfilled page template',
    });
  }

  const labels = readLabeledValues($, report);
  // Shown as "52,393400 EUR".
  const [, price, currency] = labels.get('Valor liquidativo')?.match(/^(\S+)\s+([A-Z]{3})$/) ?? [];

  const trailingReturns = tableRow($, report, 'tr#rXm_row');
  const yearlyReturns = tableRow($, report, 'tr#ra_row');
  // quefondos shows cumulative 3- and 5-year returns; muFunds reports them annualized.
  const cumulative3y = parseSpanishPercent(trailingReturns[4]);
  const cumulative5y = parseSpanishPercent(trailingReturns[5]);

  return {
    nav: parseSpanishNumber(price),
    date: labels.get('Fecha'),
    currency,
    category: labels.get('Categoría VDOS'),
    return1d: parseSpanishPercent(labels.get('1 día')),
    return1m: parseSpanishPercent(trailingReturns[1]),
    return3m: parseSpanishPercent(trailingReturns[2]),
    return1y: parseSpanishPercent(trailingReturns[3]),
    return3y: cumulative3y === undefined ? undefined : annualize(cumulative3y, 3),
    return5y: cumulative5y === undefined ? undefined : annualize(cumulative5y, 5),
    returnytd: parseSpanishPercent(yearlyReturns[1]),
  };
}

function isIsin(id: string): boolean {
  return /^[A-Z]{2}[A-Z0-9]{9}\d$/i.test(id);
}

/**
 * Reads the page's `<span class="floatleft">Label:</span><span class="floatright">Value</span>`
 * pairs. When a label repeats, the first one wins.
 */
function readLabeledValues($: CheerioAPI, container: Cheerio<AnyNode>): Map<string, string> {
  const values = new Map<string, string>();

  container.find('.floatleft').each((_, element) => {
    const label = cleanText($(element).text())?.replace(/:$/, '');
    const value = cleanText($(element).next('.floatright').text());
    if (label && value && !values.has(label)) {
      values.set(label, value);
    }
  });

  return values;
}

/** Returns the text of each cell in a table row. The first cell is the row's label. */
function tableRow($: CheerioAPI, container: Cheerio<AnyNode>, selector: string): string[] {
  return container
    .find(selector)
    .first()
    .find('td')
    .toArray()
    .map((cell) => $(cell).text());
}
