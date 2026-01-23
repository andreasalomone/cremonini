import { auth } from '@clerk/nextjs/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exportReportData } from './export.actions';

// Hoist mocks to be available in vi.mock factory
const { mockFrom, mockWhere, mockOrderBy } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockWhere: vi.fn(),
  mockOrderBy: vi.fn(),
}));

// Setup chainable mock behavior
mockFrom.mockReturnThis();
mockWhere.mockReturnThis();
mockOrderBy.mockResolvedValue([]);

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn(() => ({
      from: mockFrom,
      where: mockWhere,
      orderBy: mockOrderBy,
    })),
  },
}));

vi.mock('@/libs/Env', () => ({
  Env: {
    NEXT_PUBLIC_ADMIN_ORG_ID: 'admin_org_id',
  },
}));

describe('exportReportData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silence console logs during tests to please vitest-fail-on-console
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset chain defaults
    mockFrom.mockReturnThis();
    mockWhere.mockReturnThis();
    mockOrderBy.mockResolvedValue([]);
  });

  it('should throw Unauthorized if not logged in', async () => {
    (auth as any).mockResolvedValue({ userId: null, orgId: null });

    await expect(exportReportData({ scope: 'SINGLE_ORG', columns: ['id'] }))
      .rejects.toThrow('Unauthorized');
  });

  it('should throw if non-admin tries to export GLOBAL', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });

    await expect(exportReportData({ scope: 'GLOBAL', columns: ['id'] }))
      .rejects.toThrow('Unauthorized');
  });

  it('should throw if non-admin tries to export another org', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });

    await expect(exportReportData({ scope: 'SINGLE_ORG', columns: ['id'], orgIdFilter: 'org_2' }))
      .rejects.toThrow('Unauthorized');
  });

  it('should allow admin to export GLOBAL', async () => {
    (auth as any).mockResolvedValue({ userId: 'admin_user', orgId: 'admin_org_id' });

    const mockData = [
      { id: 'claim_1', orgId: 'org_1' },
      { id: 'claim_2', orgId: 'org_2' },
    ];
    mockOrderBy.mockResolvedValue(mockData);

    const result = await exportReportData({ scope: 'GLOBAL', columns: ['id', 'orgId'] });

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should allow normal user to export own org', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_1', orgId: 'org_1' });

    const mockData = [
      { id: 'claim_1', orgId: 'org_1' },
    ];
    mockOrderBy.mockResolvedValue(mockData);

    const result = await exportReportData({ scope: 'SINGLE_ORG', columns: ['id'] });

    expect(result).toBeDefined();
  });
});
