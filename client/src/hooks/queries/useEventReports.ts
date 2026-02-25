import { useQuery } from '@tanstack/react-query';
import {
  getEventReports,
  getEventReportStats,
  getEventReportStatus,
  type GetEventReportsResponse,
  type GetReportStatsResponse,
  type ReportStatus,
  type ReportCategory,
} from '@/lib/event-report-api';

export interface UseEventReportsFilters {
  status?: ReportStatus;
  category?: ReportCategory;
  page?: number;
  limit?: number;
}

export function useEventReports(filters: UseEventReportsFilters = {}) {
  return useQuery<GetEventReportsResponse['data']>({
    queryKey: ['event-reports', filters] as const,
    queryFn: async () => {
      const response = await getEventReports(filters);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch event reports');
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useEventReportStats() {
  return useQuery<GetReportStatsResponse['data']>({
    queryKey: ['event-report-stats'] as const,
    queryFn: async () => {
      const response = await getEventReportStats();
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch report stats');
      }
      return response.data;
    },
  });
}

export function useEventReportStatus(eventId: string | undefined, userId: string | undefined) {
  return useQuery<{ hasReported: boolean }>({
    queryKey: ['event-report-status', eventId] as const,
    queryFn: async () => {
      const response = await getEventReportStatus(eventId!);
      if (!response.success || !response.data) {
        throw new Error('Failed to check report status');
      }
      return response.data;
    },
    enabled: !!eventId && !!userId,
  });
}
