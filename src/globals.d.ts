import type { CheerioAPI } from 'cheerio';

declare global {
  /** Cheerio for Apps Script (github.com/tani/cheeriogs), loaded as a library in appsscript.json. */
  const Cheerio: { load(html: string): CheerioAPI };

  namespace GoogleAppsScript.Base {
    interface Logger {
      /** Logs at ERROR severity. Exists in Apps Script but is missing from @types/google-apps-script. */
      severe(data: unknown): Logger;
    }
  }
}
