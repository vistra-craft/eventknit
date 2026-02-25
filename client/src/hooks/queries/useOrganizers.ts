import { useQuery } from '@tanstack/react-query';
import {
  getOrganizers,
  getOrganizerDetails,
  type GetOrganizersResponse,
  type OrganizerDetailsResponse,
  type UserStatus,
} from '@/lib/admin-api';

export interface UseOrganizersFilters {
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export function useOrganizers(filters: UseOrganizersFilters = {}) {
  return useQuery<GetOrganizersResponse['data']>({
    queryKey: ['organizers', filters] as const,
    queryFn: async () => {
      const response = await getOrganizers(filters);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch organizers');
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useOrganizerDetails(userId: string | null) {
  return useQuery<OrganizerDetailsResponse['data']>({
    queryKey: ['organizer-details', userId] as const,
    queryFn: async () => {
      const response = await getOrganizerDetails(userId!);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch organizer details');
      }
      return response.data;
    },
    enabled: !!userId,
  });
}
