import { describeError, MuFundsError } from './errors.ts';
import type { Cache, Services } from './types.ts';

/** Services backed by Apps Script's UrlFetchApp, CacheService and the Cheerio library from the manifest. */
export function appsScriptServices(): Services {
  return {
    fetch(url) {
      let response: GoogleAppsScript.URL_Fetch.HTTPResponse;
      try {
        // Return non-2xx responses instead of throwing, so sources can handle them.
        response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      } catch (error) {
        if (isUrlFetchQuotaError(error)) {
          throw new MuFundsError('QUOTA_EXCEEDED', { internalMessage: describeError(error), cause: error });
        }
        throw error;
      }
      return {
        status: response.getResponseCode(),
        body: response.getContentText(),
      };
    },
    loadHtml(html) {
      return Cheerio.load(html);
    },
    cache: scriptCache(),
  };
}

/**
 * The script cache, which every user of the add-on shares. Asset data is public, so one
 * lookup can serve everyone. A cache failure counts as a miss, so it never breaks a lookup.
 */
function scriptCache(): Cache {
  return {
    get(key) {
      try {
        return CacheService.getScriptCache().get(key);
      } catch {
        return null;
      }
    },
    put(key, value, expirationInSeconds) {
      try {
        CacheService.getScriptCache().put(key, value, expirationInSeconds);
      } catch {
        // Not cached: the next lookup fetches again.
      }
    },
  };
}

/**
 * Whether `error` is Apps Script's "Service invoked too many times for one day: urlfetch."
 * The message is translated into the user's language, but always ends with the service name,
 * so match on that. Other UrlFetch errors end with the URL, and the short-term rate limit
 * ("...in a short time: urlfetch. Try Utilities.sleep...") ends with advice.
 */
export function isUrlFetchQuotaError(error: unknown): boolean {
  return error instanceof Error && /:\s*urlfetch\.?\s*$/i.test(error.message);
}
