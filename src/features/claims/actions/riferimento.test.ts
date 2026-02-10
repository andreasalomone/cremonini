import { describe, expect, it, vi } from 'vitest';

import { getNextRiferimento } from './claims.actions';

// Mock the DB module to prevent actual connection
vi.mock('@/libs/DB', () => ({
  db: {
    query: {
      claimsSchema: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock the Logger
vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('getNextRiferimento', () => {
  it('returns 001 if no claims exist', async () => {
    const mockFind = vi.fn().mockResolvedValueOnce(undefined);
    const mockProvider = { query: { claimsSchema: { findFirst: mockFind } } };
    const result = await getNextRiferimento('org-1', mockProvider);

    expect(result).toBe('001');
    expect(mockFind).toHaveBeenCalled();
  });

  it('increments 001 to 002', async () => {
    const mockFind = vi.fn().mockResolvedValueOnce({ riferimento: '001' } as any);
    const mockProvider = { query: { claimsSchema: { findFirst: mockFind } } };
    const result = await getNextRiferimento('org-1', mockProvider);

    expect(result).toBe('002');
  });

  it('increments 009 to 010', async () => {
    const mockFind = vi.fn().mockResolvedValueOnce({ riferimento: '009' } as any);
    const mockProvider = { query: { claimsSchema: { findFirst: mockFind } } };
    const result = await getNextRiferimento('org-1', mockProvider);

    expect(result).toBe('010');
  });

  it('increments 099 to 100', async () => {
    const mockFind = vi.fn().mockResolvedValueOnce({ riferimento: '099' } as any);
    const mockProvider = { query: { claimsSchema: { findFirst: mockFind } } };
    const result = await getNextRiferimento('org-1', mockProvider);

    expect(result).toBe('100');
  });

  it('returns 001 if latest is 000', async () => {
    const mockFind = vi.fn().mockResolvedValueOnce({ riferimento: '000' } as any);
    const mockProvider = { query: { claimsSchema: { findFirst: mockFind } } };
    const result = await getNextRiferimento('org-1', mockProvider);

    expect(result).toBe('001');
  });

  it('returns 001 if latest is invalid number', async () => {
    const mockFind = vi.fn().mockResolvedValueOnce({ riferimento: 'abc' } as any);
    const mockProvider = { query: { claimsSchema: { findFirst: mockFind } } };
    const result = await getNextRiferimento('org-1', mockProvider);

    expect(result).toBe('001');
  });

  it('returns 001 if latest is 999 (rollover)', async () => {
    const mockFind = vi.fn().mockResolvedValueOnce({ riferimento: '999' } as any);
    const mockProvider = { query: { claimsSchema: { findFirst: mockFind } } };
    const result = await getNextRiferimento('org-1', mockProvider);

    expect(result).toBe('001');
  });

  it('returns 001 on database error', async () => {
    const mockFind = vi.fn().mockRejectedValueOnce(new Error('DB Error'));
    const mockProvider = { query: { claimsSchema: { findFirst: mockFind } } };
    const result = await getNextRiferimento('org-1', mockProvider);

    expect(result).toBe('001');
  });
});
