import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardStats, type AdminDashboardStatsResponse } from '@/lib/admin-api';

/**
 * Query hook to fetch admin dashboard statistics
 *
 * Features:
 * - Fetches key metrics (events, staff, organizers, revenue)
 * - Cached for 5 minutes (staleTime from queryClient config)
 * - Automatically refetches when timeRange changes
 * - Invalidate with queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
 *
 * @param timeRange - Time range for stats ('7d' | '30d' | '90d' | '1y')
 * @returns Query result with dashboard stats
 */
export function useAdminDashboardStats(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
  return useQuery<AdminDashboardStatsResponse['data']>({
    queryKey: ['admin-dashboard-stats', timeRange] as const,
    queryFn: async () => {
      const response = await getAdminDashboardStats(timeRange);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch admin dashboard stats');
      }

      return response.data;
    },
    // Refetch every 2 minutes for dashboard stats (fresher than default 5min)
    staleTime: 1000 * 60 * 2,
  });
}
