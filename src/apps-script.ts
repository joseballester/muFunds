import type { Services } from './types.ts';

/** Services backed by Apps Script's UrlFetchApp and the Cheerio library from the manifest. */
export function appsScriptServices(): Services {
  return {
    fetch(url) {
      // Return non-2xx responses instead of throwing, so sources can handle them.
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      return {
        status: response.getResponseCode(),
        body: response.getContentText(),
      };
    },
    loadHtml(html) {
      return Cheerio.load(html);
    },
  };
}
