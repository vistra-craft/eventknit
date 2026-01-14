import { useQuery } from '@tanstack/react-query';
import { getEventStaff, type EventStaffAssignment } from '@/lib/admin-api';

interface UseEventStaffOptions {
  role?: string;
  staffType?: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
  isActive?: boolean;
}

interface EventStaffResponse {
  assignments: EventStaffAssignment[];
}

/**
 * Query hook to fetch staff assignments for an event
 *
 * Features:
 * - Automatic caching and refetching
 * - Filter by role, staff type, and active status
 * - Invalidate with queryClient.invalidateQueries({ queryKey: ['event-staff', eventId] })
 *
 * @param eventId - The event ID
 * @param options - Filter options (role, staffType, isActive)
 * @returns Query result with staff assignments data
 */
export function useEventStaff(eventId: string, options: UseEventStaffOptions = {}) {
  return useQuery<EventStaffResponse>({
    queryKey: ['event-staff', eventId, options] as const,
    queryFn: async () => {
      const filters: {
        role?: string;
        staffType?: 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
        isActive?: boolean;
      } = {};

      if (options.role && options.role !== 'all') {
        filters.role = options.role;
      }

      if (options.staffType && options.staffType !== 'all') {
        filters.staffType = options.staffType as 'ADMIN_STAFF' | 'ORGANIZER_STAFF';
      }

      if (options.isActive !== undefined) {
        filters.isActive = options.isActive;
      }

      const response = await getEventStaff(eventId, filters);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch event staff');
      }

      return response.data;
    },
    // Only fetch if we have a valid eventId
    enabled: !!eventId,
  });
}
