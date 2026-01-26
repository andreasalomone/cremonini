/**
 * Sanitizes Italian currency strings (e.g. "1.234,56") into
 * standard decimal strings (e.g. "1234.56") for the DB.
 */
export const sanitizeCurrency = (val?: string): string | null => {
  if (!val) {
    return null;
  }
  // Remove thousands separator (.) and replace decimal separator (,) with (.)
  return val.replace(/\./g, '').replace(',', '.');
};
