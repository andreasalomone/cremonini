import { sql } from 'drizzle-orm';

/**
 * SQL helper to ensure a column is treated as NUMERIC for database-level aggregation.
 * Since economic fields are now DECIMAL(15, 2), we can directly cast them
 * if they are not already treated as numbers by the engine.
 */
export const parseCurrencySql = (column: unknown) => sql`
  COALESCE(NULLIF(${column}, '')::NUMERIC, 0)
`;
