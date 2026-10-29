# muFunds

A Google Sheets add-on that adds a `=muFunds()` custom function for pulling mutual fund, ETF, pension plan and stock data (NAV, date, daily change, currency, expense ratio, category and returns) straight into a spreadsheet.

Full user documentation is at **[mufunds.com](https://mufunds.com)**.

## Installation

Install muFunds from the [Google Workspace Marketplace](https://workspace.google.com/marketplace/app/mufunds/1097038663644), then open a spreadsheet and enable it from the Extensions menu. See the [install instructions](https://mufunds.com/install.html) for step-by-step setup.

## Usage

```
=muFunds(option, id, [source])
```

| Argument | Description                                                                          |
| -------- | ------------------------------------------------------------------------------------ |
| `option` | The value to fetch (see below).                                                      |
| `id`     | Asset identifier: ISIN, ticker, Morningstar ID, or another code the source supports. |
| `source` | Optional. `morningstar` (default) or `quefondos`.                                    |

Examples:

```
=muFunds("nav", "IE00B03HD191")
=muFunds("expenses", "IE00B03HD191", "morningstar")
=muFunds("return1y", "N5396", "quefondos")
```

### Options

| Option                             | Returns                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| `nav`                              | Latest net asset value / close price                       |
| `date`                             | Date of the latest NAV                                     |
| `change`                           | Daily change, as a fraction (same as `return1d`)           |
| `currency`                         | Price currency (GBX prices are converted to GBP)           |
| `expenses`                         | Expense ratio, as a fraction                               |
| `category`                         | Morningstar category (or the source's equivalent)          |
| `return1d`, `return1m`, `return3m` | Total return over 1 day, 1 month, 3 months                 |
| `return1y`, `return3y`, `return5y` | Total return over 1, 3, 5 years (3y and 5y are annualized) |
| `returnytd`                        | Year-to-date return                                        |

Percentages are returned as fractions (`0.012` for 1.2%), so format the cell as a percentage in Sheets. Options and source names are not case-sensitive.

### Data sources

- **`morningstar`** (default): uses Morningstar's screener API across funds, ETFs, stocks, UK and French pension funds, Indian closed-end funds and LSE investment trusts. It matches the `id` against ISIN, SecId, PerformanceId, ticker, Valoren, WKN, SEDOL, MEX, DGS code and APIR. If the screener is unavailable, it falls back to Morningstar's quote API, which only has `nav`, `date`, `currency` and `change`. Older country-specific names like `morningstar-es` or `morningstar-uk` are still accepted and behave the same.
- **`quefondos`**: scrapes [quefondos.com](https://www.quefondos.com) for Spanish funds (by ISIN) and pension plans (by DGS code). Does not support `expenses`.

### Errors

| Message                                | Meaning                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Unknown option.`                      | `option` is not in the list above.                                                                                 |
| `Asset identifier is empty.`           | `id` is blank.                                                                                                     |
| `Unknown data source.`                 | `source` is not supported.                                                                                         |
| `Asset not found.`                     | The source has no match for `id`.                                                                                  |
| `Multiple results found...`            | The `id` matches several assets (for example, an ETF listed on several exchanges). Use a more specific identifier. |
| `Requested data is not available...`   | The asset exists but the source doesn't provide that option for it. Try another source.                            |
| `Your Google account has reached...`   | Google limits how many requests a script can make per account per day. Values load again within 24 hours.          |
| `The data source is not responding...` | The source failed or answered with something unexpected. Try again later.                                          |

See [mufunds.com/troubleshooting.html](https://mufunds.com/troubleshooting.html) for more help.

## Development

The code is TypeScript in `src/`. [esbuild](https://esbuild.github.io) bundles it into a single Apps Script file, `dist/muFunds.js`, which [clasp](https://github.com/google/clasp) pushes along with the manifest. You need Node 24 or later (see `.nvmrc`).

```
src/
  index.ts               getAssetValue(): validates arguments, picks a source, returns one field
  custom-functions.js    The top-level =muFunds() function that Sheets sees, appended to the bundle
  apps-script.ts         Services backed by UrlFetchApp and the Cheerio library
  types.ts               AssetData (every field a source can return), Services, Source
  errors.ts              Error codes, with their messages and severities
  parse.ts               Text and number parsing for scraped values
  sources/
    index.ts             Maps the `source` argument to a source
    morningstar.ts       Morningstar screener, with the quote API as fallback
    quefondos.ts         quefondos.com scraper
scripts/build.ts         Bundles src/ into dist/muFunds.js
test/
  *.test.ts              Offline tests against saved responses in fixtures/
  live/*.test.ts         Tests that call the real data sources
appsscript.json          Apps Script manifest (scopes, Cheerio library)
```

Each source returns an `AssetData` object with every field it found, and `getAssetValue()` picks the one the user asked for. Sources get network access and HTML parsing through a `Services` object instead of Apps Script globals, so tests can pass in fakes.

HTML parsing uses the [Cheerio for Apps Script](https://github.com/tani/cheeriogs) library, which the manifest loads as `Cheerio`. Tests use the npm `cheerio` package instead.

### Errors and logging

All errors are defined in `src/errors.ts`, in one table that gives each code its user-facing message, a short internal message for the logs, and a severity. Throw them with `new MuFundsError(code)`, or pass `{ internalMessage }` to log something more specific. The internal message is never shown to the user. Anything else a source throws, like a network failure or an `HttpError`, reaches the user as `SOURCE_UNAVAILABLE`, and the original error is kept as its `cause`. The exception is Apps Script's daily UrlFetch quota error, which `appsScriptServices()` turns into `QUOTA_EXCEEDED` before any source sees it.

`muFunds()` logs every error with `Logger`, which sends it to Cloud Logging as a structured `jsonPayload`: `INFO` errors with `Logger.log`, `ERROR` errors with `Logger.severe`. Each entry has `errorCode`, `message` (the internal message, which Logs Explorer shows as the summary line), `userMessage` (what the cell shows) and a `context` with the arguments and stack trace. Filter on `jsonPayload.errorCode` to find one kind of error.

### Commands

```bash
npm install
```

| Command             | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `npm test`          | Runs the offline tests                                         |
| `npm run test:live` | Runs tests against Morningstar and quefondos (needs network)   |
| `npm run check`     | Type-checks everything with `tsc`                              |
| `npm run format`    | Formats the code with Prettier (`format:check` only checks it) |
| `npm run build`     | Bundles the add-on into `dist/`                                |
| `npm run push`      | Builds and pushes to Apps Script with clasp                    |

CI runs formatting, type-checking, offline tests and the build on every push and pull request. The live tests can break when upstream data changes, so they are run by hand.

### Adding a source

1. Create `src/sources/<name>.ts` exporting a function `(id, services) => AssetData`. Leave fields it can't provide undefined, and throw `new MuFundsError('ASSET_NOT_FOUND')` when the id doesn't exist.
2. Register it in `src/sources/index.ts`.
3. Save a sample response in `test/fixtures/` and add `test/<name>.test.ts`.

### Deploying

```bash
npx clasp login
```

```bash
npm run push
```

`.clasp.json` holds the script ID and is git-ignored, so create it locally or run `npx clasp clone <scriptId>` first. `.claspignore` limits the upload to `appsscript.json` and `dist/muFunds.js`.

## Contributing

Issues and pull requests are welcome. If a fund returns wrong or missing data, please [open an issue](https://github.com/joseballester/muFunds/issues) with the identifier, option and source you used. For pull requests, run `npm test` and `npm run check` first, and add a test with a saved response in `test/fixtures/` when you change how a source parses data.

## License

muFunds is released under the [MIT License](LICENSE).

The license covers the code only. The muFunds name and logo are not included and may not be used for other add-ons or services without permission.
