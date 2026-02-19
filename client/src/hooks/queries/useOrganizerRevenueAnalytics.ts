import { useQuery } from '@tanstack/react-query';
import { getRevenueAnalytics } from '@/lib/organizer-dashboard-api';

/**
 * Query hook to fetch organizer revenue analytics for charts
 *
 * Returns: summary, byTicketType, refunds, averageOrderValue, forecasting
 *
 * @param filters - Optional filters (eventId, startDate, endDate)
 * @returns Query result with revenue analytics data
 */
export function useOrganizerRevenueAnalytics(filters?: {
  eventId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['organizer-revenue-analytics', filters] as const,
    queryFn: async () => {
      const response = await getRevenueAnalytics(filters);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch revenue analytics');
      }

      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}
