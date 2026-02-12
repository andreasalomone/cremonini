/**
 * Sanitizes Italian currency strings (e.g. "1.234,56") into
 * standard decimal strings (e.g. "1234.56") for the DB.
 */
export const sanitizeCurrency = (val?: string | null): string | null => {
  if (!val) {
    return null;
  }

  // STRICT ITALIAN INTEGER MODE:
  // "1.000" -> "1000"
  // "1,000" -> "1000" (User says they never type cents, so even commas are treated as separators or ignored)
  // "1000" -> "1000"

  // Remove everything that is NOT a digit or a minus sign.
  const sanitized = val.replace(/[^\d-]/g, '');

  return sanitized;
};
