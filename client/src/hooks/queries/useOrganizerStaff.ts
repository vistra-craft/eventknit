import { useQuery } from '@tanstack/react-query';
import { getOrganizerStaff, type OrganizerStaff } from '@/lib/organizer-api';

/**
 * Query hook to fetch available organizer staff members
 *
 * Features:
 * - Fetches all organizer staff
 * - Cached for 5 minutes (staleTime)
 * - Invalidate with queryClient.invalidateQueries({ queryKey: ['organizer-staff'] })
 *
 * @returns Query result with available organizer staff members
 */
export function useOrganizerStaff() {
  return useQuery<OrganizerStaff[]>({
    queryKey: ['organizer-staff'] as const,
    queryFn: async () => {
      const response = await getOrganizerStaff();

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch organizer staff');
      }

      return response.data.staff;
    },
  });
}
