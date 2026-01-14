import { useQuery } from '@tanstack/react-query';
import { getUsers, type User } from '@/lib/admin-api';
import { UserRole } from '@/types/auth';

const STAFF_ROLES: UserRole[] = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN_STAFF,
  UserRole.MARKETER,
  UserRole.SUPPORT,
  UserRole.TELLER,
];

/**
 * Query hook to fetch available staff members
 *
 * Features:
 * - Fetches all active users with staff roles
 * - Automatically filters to SUPERADMIN, ADMIN_STAFF, MARKETER, SUPPORT, TELLER
 * - Cached for 5 minutes (staleTime)
 * - Invalidate with queryClient.invalidateQueries({ queryKey: ['available-staff'] })
 *
 * @returns Query result with available staff members
 */
export function useAvailableStaff() {
  return useQuery<User[]>({
    queryKey: ['available-staff'] as const,
    queryFn: async () => {
      const response = await getUsers({
        role: undefined, // Get all roles
        status: 'ACTIVE',
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch staff');
      }

      // Filter to only staff roles
      const staff = response.data.users.filter((user) =>
        STAFF_ROLES.includes(user.role as UserRole)
      );

      return staff;
    },
  });
}
