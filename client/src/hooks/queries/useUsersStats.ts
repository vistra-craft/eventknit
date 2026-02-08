import { useQuery } from '@tanstack/react-query';
import { getUsersStats, type UserStatsResponse } from '@/lib/admin-api';

/**
 * Query hook to fetch user statistics
 *
 * Features:
 * - Fetches user metrics (staff, organizers, attendees, active users)
 * - Cached for 2 minutes (staleTime)
 * - Automatically refetches when timeRange changes
 * - Invalidate with queryClient.invalidateQueries({ queryKey: ['users-stats'] })
 *
 * @param timeRange - Time range for stats ('7d' | '30d' | '90d' | '1y')
 * @returns Query result with user stats
 */
export function useUsersStats(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
  return useQuery<UserStatsResponse['data']>({
    queryKey: ['users-stats', timeRange] as const,
    queryFn: async () => {
      const response = await getUsersStats(timeRange);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch user stats');
      }

      return response.data;
    },
    // Refetch every 2 minutes for user stats
    staleTime: 1000 * 60 * 2,
  });
}
