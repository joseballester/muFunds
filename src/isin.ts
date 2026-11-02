/** An ISIN: a 2-letter country code, 9 letters or digits, and a check digit. */
const ISIN_SHAPE = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

/**
 * Whether `id` is shaped like an ISIN but its check digit is wrong, which almost
 * always means a typo. Ids of any other shape return false: they may be tickers
 * or other codes, which have no check digit.
 */
export function isMistypedIsin(id: string): boolean {
  const isin = id.toUpperCase();
  return ISIN_SHAPE.test(isin) && !hasValidCheckDigit(isin);
}

/**
 * The Luhn check over the ISIN, with each letter replaced by its value (A = 10, …, Z = 35).
 * It catches any single wrong character and most swapped digits, but not every swap of two letters.
 */
function hasValidCheckDigit(isin: string): boolean {
  const digits = [...isin].map((char) => parseInt(char, 36)).join('');
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    // From the right, every second digit is doubled.
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
