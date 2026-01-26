'use server';

// Explicitly require buffer to avoid global variable lint error
import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import { and, desc, eq } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { z } from 'zod';

import { AVAILABLE_COLUMNS } from '@/features/reports/constants';
import { checkIsSuperAdmin } from '@/libs/auth-utils';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { claimsSchema } from '@/models/Schema';

// Validation Schema
const exportSchema = z.object({
  scope: z.enum(['GLOBAL', 'SINGLE_ORG']),
  columns: z.array(z.string()),
  orgIdFilter: z.string().optional(),
});

type ExportInput = z.infer<typeof exportSchema>;

/**
 * Exports report data to an Excel file buffer (Base64).
 * Validates user permissions and generates a .xlsx file.
 */
export async function exportReportData(input: ExportInput): Promise<string> {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    // Validate Input
    const validated = exportSchema.parse(input);
    const { scope, columns, orgIdFilter } = validated;

    const isSuperAdmin = checkIsSuperAdmin(orgId);

    // Security Check
    if (scope === 'GLOBAL' && !isSuperAdmin) {
      logger.error(`[Export] Unauthorized GLOBAL export attempt by user ${userId}`);
      throw new Error('Unauthorized: Only Super Admins can export global data.');
    }

    if (scope === 'SINGLE_ORG' && orgIdFilter && orgIdFilter !== orgId && !isSuperAdmin) {
      logger.error(`[Export] Unauthorized CROSS-ORG export attempt by user ${userId} for org ${orgIdFilter}`);
      throw new Error('Unauthorized: You can only export your own organization data.');
    }

    // Determine effective Org Filter
    const effectiveOrgId = scope === 'GLOBAL' ? undefined : (orgIdFilter || orgId);
    logger.info(`[Export] User ${userId} exporting ${scope} ${effectiveOrgId ? `for org ${effectiveOrgId}` : 'ALL ORGS'}`);

    const conditions = [];
    if (effectiveOrgId) {
      conditions.push(eq(claimsSchema.orgId, effectiveOrgId));
    }

    // Execute Query
    const data = await db
      .select()
      .from(claimsSchema)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(claimsSchema.createdAt));

    logger.info(`[Export] Fetched ${data.length} records`);

    // Create Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Filter columns to export
    const finalColumns = columns.length > 0
      ? columns.filter(c => AVAILABLE_COLUMNS[c])
      : Object.keys(AVAILABLE_COLUMNS);

    worksheet.columns = finalColumns.map(key => ({
      header: AVAILABLE_COLUMNS[key],
      key,
      width: 20,
    }));

    // Add Rows
    const rows = data.map((claim) => {
      const row: Record<string, unknown> = {};
      finalColumns.forEach((key) => {
        // Safe access as key is string, claim has string keys.
        // We cast claim to any to avoid strict type error since we're selecting *,
        // but in reality we know the schema matches.
        const val = (claim as any)[key];
        row[key] = val;
      });
      return row;
    });

    worksheet.addRows(rows);

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return Base64
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    logger.error('[ExportAction] Export failed:', error);
    throw new Error('Export failed');
  }
}
