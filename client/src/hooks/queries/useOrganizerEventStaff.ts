import { useQuery } from '@tanstack/react-query';
import { getOrganizerEventStaff, type EventStaffAssignment } from '@/lib/organizer-api';

interface UseOrganizerEventStaffOptions {
  role?: string;
  isActive?: boolean;
}

interface OrganizerEventStaffResponse {
  assignments: EventStaffAssignment[];
}

/**
 * Query hook to fetch organizer staff assignments for an event
 *
 * Features:
 * - Automatic caching and refetching
 * - Filter by role and active status
 * - Invalidate with queryClient.invalidateQueries({ queryKey: ['organizer-event-staff', eventId] })
 *
 * @param eventId - The event ID
 * @param options - Filter options (role, isActive)
 * @returns Query result with staff assignments data
 */
export function useOrganizerEventStaff(eventId: string, options: UseOrganizerEventStaffOptions = {}) {
  return useQuery<OrganizerEventStaffResponse>({
    queryKey: ['organizer-event-staff', eventId, options] as const,
    queryFn: async () => {
      const filters: {
        role?: string;
        isActive?: boolean;
      } = {};

      if (options.role && options.role !== 'all') {
        filters.role = options.role;
      }

      if (options.isActive !== undefined) {
        filters.isActive = options.isActive;
      }

      const response = await getOrganizerEventStaff(eventId, filters);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch organizer event staff');
      }

      return response.data;
    },
    // Only fetch if we have a valid eventId
    enabled: !!eventId,
  });
}
