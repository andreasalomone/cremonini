/**
 * Centralized Italian holidays for legal calculations (Sunday roll-overs and working days).
 * Includes fixed national holidays.
 */
export const ITALIAN_HOLIDAYS = [
  '01-01', // Capodanno
  '01-06', // Epifania
  '04-25', // Liberazione
  '05-01', // Lavoro
  '06-02', // Repubblica
  '08-15', // Ferragosto
  '11-01', // Ognissanti
  '12-08', // Immacolata
  '12-25', // Natale
  '12-26', // S. Stefano
];

/**
 * Checks if a given date is a Sunday or a fixed Italian national holiday.
 */
export function isHoliday(date: Date): boolean {
  // Sunday is always a holiday for legal purposes
  if (date.getDay() === 0) {
    return true;
  }

  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return ITALIAN_HOLIDAYS.includes(monthDay);
}
