import { Env } from '@/libs/Env';

/**
 * Checks if the given organization ID belongs to a Super Admin.
 * This utilizes the centralized environment variable for the Admin Org ID.
 *
 * @param orgId - The Organization ID to check.
 * @returns boolean - True if the user is a Super Admin.
 */
export const checkIsSuperAdmin = (orgId: string | undefined | null): boolean => {
  if (!orgId) {
    return false;
  }
  return orgId === Env.NEXT_PUBLIC_ADMIN_ORG_ID;
};
