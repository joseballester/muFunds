# muFunds

A Google Sheets add-on that adds a `=muFunds()` custom function for pulling mutual fund, ETF, pension plan and stock data (NAV, date, daily change, currency, expense ratio, category and returns) straight into a spreadsheet.

Full user documentation is at **[mufunds.com](https://mufunds.com)**.

## Installation

Install muFunds from the [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/mufunds/1097038663644), then open a spreadsheet and enable it from the Extensions menu. See the [install instructions](https://mufunds.com/install.html) for step-by-step setup.

## Usage

```
=muFunds(option, id, [source])
```

| Argument | Description |
| --- | --- |
| `option` | The value to fetch (see below). |
| `id` | Asset identifier: ISIN, ticker, Morningstar ID, or another code the source supports. |
| `source` | Optional. `morningstar` (default) or `quefondos`. |

Examples:

```
=muFunds("nav", "IE00B03HD191")
=muFunds("expenses", "IE00B03HD191", "morningstar")
=muFunds("return1y", "N5396", "quefondos")
```

### Options

| Option | Returns |
| --- | --- |
| `nav` | Latest net asset value / close price |
| `date` | Date of the latest NAV |
| `change` | Daily change, as a fraction (same as `return1d`) |
| `currency` | Price currency (GBX prices are converted to GBP) |
| `expenses` | Expense ratio, as a fraction |
| `category` | Morningstar category (or the source's equivalent) |
| `return1d`, `return1m`, `return3m` | Total return over 1 day, 1 month, 3 months |
| `return1y`, `return3y`, `return5y` | Total return over 1, 3, 5 years (3y and 5y are annualized) |
| `returnytd` | Year-to-date return |

Percentages are returned as fractions (`0.012` for 1.2%), so format the cell as a percentage in Sheets.

### Data sources

- **`morningstar`** (default): uses Morningstar's screener API across funds, ETFs, stocks, UK and French pension funds, Indian closed-end funds and LSE investment trusts. It matches the `id` against ISIN, SecId, PerformanceId, ticker, Valoren, WKN, SEDOL, MEX, DGS code and APIR. If the screener finds nothing, it falls back to Morningstar's quote API for `nav`, `date`, `currency` and `change`. Older country-specific names like `morningstar-es` or `morningstar-uk` are still accepted and behave the same.
- **`quefondos`**: scrapes [quefondos.com](https://www.quefondos.com) for Spanish funds (by ISIN) and pension plans (by DGS code). Does not support `expenses`.

### Errors

| Message | Meaning |
| --- | --- |
| `Unknown option.` | `option` is not in the list above. |
| `Asset identifier is empty.` | `id` is blank. |
| `Unknown data source.` | `source` is not supported. |
| `Asset not found.` | The source has no match for `id`. |
| `Multiple results found` | The `id` matches several assets (for example, an ETF listed on several exchanges). Use a more specific identifier. |
| `Requested data is not available` | The asset exists but the source doesn't provide that option for it. Try another source. |

See [mufunds.com/troubleshooting.html](https://mufunds.com/troubleshooting.html) for more help.

## Development

The add-on is plain Google Apps Script (V8 runtime). All files in `src/` share one global scope, as Apps Script requires, so there are no imports or exports.

```
src/
  main.js              muFunds() entry point: validates arguments and picks a source
  errors.js            User-facing error messages
  helpers.js           Parsing helpers for scraped values
  sources/
    morningstar.js     Morningstar screener + quote API
    quefondos.js       quefondos.com HTML scraper
test/
  mocks/               Node stand-ins for Apps Script globals (UrlFetchApp, CacheService, Logger)
  snapshots/           Saved API/HTML responses for unit tests
  *_unit.js            Offline tests against snapshots
  *_live.js            Tests that hit the real data sources
appsscript.json        Apps Script manifest (scopes, Cheerio library)
```

HTML parsing uses the [Cheerio for Apps Script](https://github.com/tani/cheeriogs) library, which the manifest loads as `Cheerio`. In tests, the npm `cheerio` package is injected under the same name.

### Running tests

```bash
npm install
```

```bash
npm test
```

The tests load every file in `src/` into a Node `vm` context with mocked Apps Script globals. The `*_live.js` suites make real HTTP requests to Morningstar and quefondos, so they need network access and can break when upstream data changes. Live responses are cached in `test/cache/` for one minute to avoid hammering the sources during repeated runs.

To run only the offline tests:

```bash
npx mocha test/main.js test/*_unit.js
```

### Deploying

The project is pushed to Apps Script with [clasp](https://github.com/google/clasp). `.claspignore` keeps tests and Node files out of the upload.

```bash
npm install -g @google/clasp
```

```bash
clasp login
```

```bash
clasp push
```

`.clasp.json` (which holds the script ID) is git-ignored, so create it locally or run `clasp clone <scriptId>` first.

## Contributing

Issues and pull requests are welcome. If a fund returns wrong or missing data, please [open an issue](https://github.com/joseballester/muFunds/issues) with the identifier, option and source you used. For pull requests, run `npm test` first and add a unit test with a snapshot when you change how a source parses data.

## License

muFunds is released under the [MIT License](LICENSE).

The license covers the code only. The muFunds name and logo are not included and may not be used for other add-ons or services without permission.
