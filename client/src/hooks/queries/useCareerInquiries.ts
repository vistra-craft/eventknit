import { useQuery } from '@tanstack/react-query';
import {
  getCareerInquiries,
  type GetCareerInquiriesResponse,
  type CareerInquiryStatus,
} from '@/lib/careers-api';

export interface UseCareerInquiriesFilters {
  status?: CareerInquiryStatus;
  page?: number;
  limit?: number;
}

export function useCareerInquiries(filters: UseCareerInquiriesFilters = {}) {
  return useQuery<GetCareerInquiriesResponse['data']>({
    queryKey: ['career-inquiries', filters] as const,
    queryFn: async () => {
      const response = await getCareerInquiries(filters);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch career inquiries');
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}
