import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient configuration for TanStack Query
 *
 * Default options:
 * - Queries are cached for 5 minutes (staleTime)
 * - Cache data is garbage collected after 10 minutes (gcTime)
 * - Failed queries retry 1 time before showing error
 * - Refetch on window focus is disabled (can be enabled per-query)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,

      // Cache data is kept for 10 minutes
      gcTime: 1000 * 60 * 10,

      // Retry failed requests once
      retry: 1,

      // Don't refetch on window focus (prevents unnecessary API calls)
      refetchOnWindowFocus: false,

      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
