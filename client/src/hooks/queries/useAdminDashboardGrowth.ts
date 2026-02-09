import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardGrowth, type AdminDashboardGrowthResponse, type AdminDashboardGrowthPeriod } from '@/lib/admin-api';

/**
 * Query hook to fetch admin dashboard growth data for charts
 *
 * Features:
 * - Fetches growth series data (organizers, events, revenue, attendees)
 * - Cached for 5 minutes (staleTime from queryClient config)
 * - Automatically refetches when period changes
 * - Invalidate with queryClient.invalidateQueries({ queryKey: ['admin-dashboard-growth'] })
 *
 * @param period - Growth period ('monthly' | 'quarterly' | 'semiannual' | 'yearly')
 * @returns Query result with growth data for charts
 */
export function useAdminDashboardGrowth(period: AdminDashboardGrowthPeriod = 'monthly') {
  return useQuery<AdminDashboardGrowthResponse['data']>({
    queryKey: ['admin-dashboard-growth', period] as const,
    queryFn: async () => {
      const response = await getAdminDashboardGrowth(period);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch admin dashboard growth data');
      }

      return response.data;
    },
    // Refetch every 5 minutes for growth charts (less critical than stats)
    staleTime: 1000 * 60 * 5,
  });
}
