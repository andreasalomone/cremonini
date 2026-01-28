// @vitest-environment jsdom
import { auth } from '@clerk/nextjs/server';
import { render, screen } from '@testing-library/react';
import { notFound, redirect } from 'next/navigation';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getClaimById } from '@/features/claims/actions/claims.actions';
import { checkIsSuperAdmin } from '@/libs/auth-utils';

import ClaimDetailPage from './page';

// ----------------------------------------------------------------------
// 1. Mocks
// ----------------------------------------------------------------------

// Mock Next.js navigation with throwing behavior to simulate interruption
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((url) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// Mock Clerk Auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Domain Logic
vi.mock('@/features/claims/actions/claims.actions', () => ({
  getClaimById: vi.fn(),
  updateClaimEconomics: vi.fn(),
  getDocumentUrl: vi.fn(),
}));

vi.mock('@/libs/auth-utils', () => ({
  checkIsSuperAdmin: vi.fn(),
}));

// Mock UI Components
vi.mock('@/features/claims/components/ClaimStatusSelect', () => ({
  ClaimStatusSelect: () => <div data-testid="mock-status-select" />,
}));
vi.mock('@/features/claims/components/EconomicFields', () => ({
  EconomicFields: () => <div data-testid="mock-economic-fields" />,
}));
vi.mock('@/features/claims/components/DocumentList', () => ({
  DocumentList: () => <div data-testid="mock-doc-list" />,
}));
vi.mock('@/features/claims/components/ClaimTimeline', () => ({
  ClaimTimeline: () => <div data-testid="mock-timeline" />,
}));
vi.mock('@/features/claims/components/DocumentUploadDialog', () => ({
  DocumentUploadDialog: () => <div data-testid="mock-upload-dialog" />,
}));

// ----------------------------------------------------------------------
// 2. Test Suite
// ----------------------------------------------------------------------

describe('ClaimDetailPage Integration & Security', () => {
  const MOCK_CLAIM_ID = 'claim_123456789';
  const MOCK_ORG_A = 'org_alpha';
  const MOCK_ORG_B = 'org_beta';

  const mockParams = Promise.resolve({ id: MOCK_CLAIM_ID });

  const mockClaimData = {
    id: MOCK_CLAIM_ID,
    type: 'THEFT',
    state: 'OPEN',
    status: 'IN_PROGRESS',
    createdAt: new Date('2024-01-01'),
    eventDate: new Date('2024-01-01'),
    documents: [],
    activities: [],
    // Economics
    estimatedValue: 1000,
    verifiedDamage: 800,
    claimedAmount: 1000,
    recoveredAmount: 0,
    estimatedRecovery: 0,
    // Org
    orgId: MOCK_ORG_A,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- HAPPY PATHS ---

  it('renders successfully for a standard user accessing their OWN org claim', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ orgId: MOCK_ORG_A } as any);
    vi.mocked(checkIsSuperAdmin).mockReturnValue(false);
    vi.mocked(getClaimById).mockResolvedValue({
      ...mockClaimData,
      orgId: MOCK_ORG_A,
    } as any);

    // Act
    const jsx = await ClaimDetailPage({ params: mockParams });
    render(jsx);

    // Assert
    expect(notFound).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByText(`Sinistro ${MOCK_CLAIM_ID.slice(0, 8)}`)).toBeInTheDocument();
  });

  it('renders successfully for a SUPER ADMIN accessing a claim from ANOTHER org', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ orgId: 'org_admin_context' } as any);
    vi.mocked(checkIsSuperAdmin).mockReturnValue(true);
    vi.mocked(getClaimById).mockResolvedValue({
      ...mockClaimData,
      orgId: MOCK_ORG_B,
    } as any);

    // Act
    const jsx = await ClaimDetailPage({ params: mockParams });
    render(jsx);

    // Assert
    expect(notFound).not.toHaveBeenCalled();
    expect(screen.getByText(`Sinistro ${MOCK_CLAIM_ID.slice(0, 8)}`)).toBeInTheDocument();
  });

  // --- SECURITY & EDGE CASES ---

  it('CRITICAL: Blocks IDOR attempt (Standard User -> Different Org Claim)', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ orgId: MOCK_ORG_A } as any);
    vi.mocked(checkIsSuperAdmin).mockReturnValue(false);
    vi.mocked(getClaimById).mockResolvedValue({
      ...mockClaimData,
      orgId: MOCK_ORG_B, // Mismatch
    } as any);

    // Mock console.error to silence the expected security alert
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    try {
      await ClaimDetailPage({ params: mockParams });
    } catch (e: any) {
      expect(e.message).toBe('NEXT_NOT_FOUND');
    }

    // Assert
    expect(getClaimById).toHaveBeenCalledWith(MOCK_CLAIM_ID);
    expect(notFound).toHaveBeenCalled();
    // Verify the security alert was logged
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Security Alert'));

    errorSpy.mockRestore();
  });

  it('redirects to sign-in if no organization context is present', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ orgId: null } as any);

    // Act
    try {
      await ClaimDetailPage({ params: mockParams });
    } catch (e: any) {
      expect(e.message).toContain('NEXT_REDIRECT');
    }

    // Assert
    expect(redirect).toHaveBeenCalledWith('/sign-in');
    expect(getClaimById).not.toHaveBeenCalled();
  });

  it('triggers notFound if the claim does not exist in DB', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ orgId: MOCK_ORG_A } as any);
    vi.mocked(getClaimById).mockResolvedValue(null);

    // Act
    try {
      await ClaimDetailPage({ params: mockParams });
    } catch (e: any) {
      expect(e.message).toBe('NEXT_NOT_FOUND');
    }

    // Assert
    expect(notFound).toHaveBeenCalled();
  });

  it('handles null/undefined fields safely without crashing (View Model Robustness)', async () => {
    // Arrange
    vi.mocked(auth).mockResolvedValue({ orgId: MOCK_ORG_A } as any);
    vi.mocked(checkIsSuperAdmin).mockReturnValue(false);
    vi.mocked(getClaimById).mockResolvedValue({
      ...mockClaimData,
      orgId: MOCK_ORG_A,
      // Dirty Data
      location: null,
      description: undefined as any,
      thirdPartyName: null,
      estimatedValue: null,
    } as any);

    // Act
    const jsx = await ClaimDetailPage({ params: mockParams });
    render(jsx);

    // Assert
    expect(screen.getByText('Nessuna descrizione fornita.')).toBeInTheDocument();
    expect(screen.getByTestId('mock-economic-fields')).toBeInTheDocument();
  });
});
