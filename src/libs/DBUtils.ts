import { sql } from 'drizzle-orm';

/**
 * SQL helper to ensure a column is treated as NUMERIC for database-level aggregation.
 * Since economic fields are now DECIMAL(15, 2), we simply coalesce NULL to 0.
 */
export const parseCurrencySql = (column: unknown) => sql`
  COALESCE(${column}, 0)
`;
