import { describe, expect, it } from 'vitest';

import { Env } from '@/libs/Env';

import { checkIsSuperAdmin } from './auth-utils';

describe('checkIsSuperAdmin', () => {
  // Get the actual admin org ID from environment
  const adminOrgId = Env.NEXT_PUBLIC_ADMIN_ORG_ID;

  describe('returns true for admin organization', () => {
    it('identifies the configured admin org as super admin', () => {
      expect(checkIsSuperAdmin(adminOrgId)).toBe(true);
    });
  });

  describe('returns false for non-admin organizations', () => {
    it('returns false for a random org ID', () => {
      expect(checkIsSuperAdmin('org_random123')).toBe(false);
    });

    it('returns false for an org ID similar to admin (prefix match)', () => {
      // Should not match even if prefix is similar
      expect(checkIsSuperAdmin(`${adminOrgId}_extra`)).toBe(false);
    });

    it('returns false for a substring of admin ID', () => {
      // Should not match a partial ID
      if (adminOrgId.length > 5) {
        expect(checkIsSuperAdmin(adminOrgId.slice(0, 5))).toBe(false);
      }
    });
  });

  describe('handles null/undefined/empty inputs', () => {
    it('returns false for null', () => {
      expect(checkIsSuperAdmin(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(checkIsSuperAdmin(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(checkIsSuperAdmin('')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('is case-sensitive (org IDs must match exactly)', () => {
      const upperCase = adminOrgId.toUpperCase();
      const lowerCase = adminOrgId.toLowerCase();

      // Only exact match should work
      if (upperCase !== adminOrgId) {
        expect(checkIsSuperAdmin(upperCase)).toBe(false);
      }
      if (lowerCase !== adminOrgId) {
        expect(checkIsSuperAdmin(lowerCase)).toBe(false);
      }
    });

    it('does not trim whitespace (exact match required)', () => {
      expect(checkIsSuperAdmin(` ${adminOrgId}`)).toBe(false);
      expect(checkIsSuperAdmin(`${adminOrgId} `)).toBe(false);
      expect(checkIsSuperAdmin(` ${adminOrgId} `)).toBe(false);
    });
  });
});
