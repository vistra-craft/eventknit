import { useQuery } from '@tanstack/react-query';
import {
  getOrganizerDashboardStats,
  getOrganizerDashboardEvents,
  getSubscription,
  getDashboardAccess,
  type OrganizerDashboardStatsResponse,
  type OrganizerDashboardEventsResponse,
} from '@/lib/organizer-api';

/**
 * Query hook to fetch organizer dashboard statistics
 *
 * Returns: totalEvents, totalAttendees, totalRevenue, totalSpeakers,
 * performanceInsights, upcomingDeadlines, healthScore
 *
 * @returns Query result with dashboard stats
 */
export function useOrganizerDashboardStats() {
  return useQuery<OrganizerDashboardStatsResponse['data']['stats']>({
    queryKey: ['organizer-dashboard-stats'] as const,
    queryFn: async () => {
      const response = await getOrganizerDashboardStats();

      if (!response.success || !response.data?.stats) {
        throw new Error('Failed to fetch organizer dashboard stats');
      }

      return response.data.stats;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Query hook to fetch organizer dashboard events with pagination
 *
 * @param page - Page number (1-indexed)
 * @returns Query result with events list and pagination info
 */
export function useOrganizerDashboardEvents(page: number = 1) {
  return useQuery<OrganizerDashboardEventsResponse['data']>({
    queryKey: ['organizer-dashboard-events', page] as const,
    queryFn: async () => {
      const response = await getOrganizerDashboardEvents({ page, limit: 12 });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch organizer dashboard events');
      }

      return response.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Query hook to fetch organizer subscription info
 *
 * @returns Query result with subscription data
 */
export function useOrganizerSubscription() {
  return useQuery({
    queryKey: ['organizer-subscription'] as const,
    queryFn: async () => {
      const response = await getSubscription();

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch organizer subscription');
      }

      return response.data.subscription;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Query hook to fetch organizer dashboard access (tier, pending events)
 *
 * @returns Query result with access tier and pending events
 */
export function useOrganizerDashboardAccess() {
  return useQuery({
    queryKey: ['organizer-dashboard-access'] as const,
    queryFn: async () => {
      const response = await getDashboardAccess();

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch dashboard access');
      }

      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}
