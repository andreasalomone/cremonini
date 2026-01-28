/**
 * Sanitizes Italian currency strings (e.g. "1.234,56") into
 * standard decimal strings (e.g. "1234.56") for the DB.
 */
export const sanitizeCurrency = (val?: string | null): string | null => {
  if (!val) {
    return null;
  }

  // Detect if the string is likely European (comma as decimal) or US/standard (dot as decimal)
  const hasComma = val.includes(',');
  const hasDot = val.includes('.');

  // Basic cleanup: remove everything except digits, dots, commas, and minus sign
  let sanitized = val.replace(/[^\d.,-]/g, '');

  if (hasComma && hasDot) {
    // Mixed format: 1.234,56 or 1,234.56
    // If the comma comes AFTER the last dot, it's European
    if (val.lastIndexOf(',') > val.lastIndexOf('.')) {
      sanitized = sanitized.replace(/\./g, '').replace(',', '.');
    } else {
      // Otherwise assume US: 1,234.56
      sanitized = sanitized.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Simple European: 1234,56
    sanitized = sanitized.replace(',', '.');
  } else {
    // Simple or US standard: 1234.56 or 1234
    // No action needed for dots, they are already standard decimal separators
  }

  return sanitized;
};
