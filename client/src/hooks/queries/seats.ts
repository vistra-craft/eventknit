import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';

// Query key factory for seat queries
export const seatQueryKeys = {
  all: ['seats'] as const,
  allocationSummary: (eventId: string) => [...seatQueryKeys.all, 'summary', eventId] as const,
  allocations: (eventId: string) => [...seatQueryKeys.all, 'allocations', eventId] as const,
  allocationByType: (eventId: string) => [...seatQueryKeys.all, 'by-type', eventId] as const,
  operations: (eventId: string) => [...seatQueryKeys.all, 'operations', eventId] as const,
  registrationSeats: (registrationId: string) => [...seatQueryKeys.all, 'registration', registrationId] as const,
};

// API Response types
export interface SeatAllocationSummary {
  totalSeats: number;
  allocatedSeats: number;
  availableSeats: number;
  pendingSeats: number;
  byStatus: Record<string, number>;
  lastUpdated: string;
}

export interface SeatAllocation {
  id: string;
  registrationId: string;
  attendeeName: string;
  attendeeEmail: string;
  seatId: string;
  seatLocation: string;
  status: 'CONFIRMED' | 'PENDING' | 'RELEASED';
  allocatedAt: string;
}

export interface SeatAllocationByType {
  byType: Record<string, {
    allocated: number;
    available: number;
    pending: number;
    total: number;
  }>;
}

export interface SeatOperation {
  id: string;
  type: 'RELEASED' | 'ALLOCATION';
  seatId: string;
  seatLocation: string;
  attendeeName: string;
  attendeeEmail: string;
  status: string;
  operationDate: string;
  registrationId: string;
}

export interface RegistrationSeat {
  seatId: string;
  location: string;
  section: string;
  row: string;
  number: string;
  type: string;
  price: number;
  status: 'CONFIRMED' | 'PENDING' | 'RELEASED';
  allocatedAt: string;
}

// Hook: Get seat allocation summary
export function useSeatAllocationSummary(eventId: string) {
  return useQuery({
    queryKey: seatQueryKeys.allocationSummary(eventId),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: SeatAllocationSummary }>(
        `/organizer-dashboard/events/${eventId}/seats/summary`,
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    enabled: !!eventId,
  });
}

// Hook: Get seat allocations with pagination
export function useSeatAllocations(
  eventId: string,
  page: number = 1,
  limit: number = 50,
  statusFilter: string = 'all',
) {
  return useQuery({
    queryKey: [...seatQueryKeys.allocations(eventId), page, limit, statusFilter],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          allocations: SeatAllocation[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        };
      }>(`/organizer-dashboard/events/${eventId}/seats/allocations`, {
        params: {
          page,
          limit,
          status: statusFilter,
        },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!eventId,
  });
}

// Hook: Get seat allocation breakdown by ticket type
export function useSeatAllocationByType(eventId: string) {
  return useQuery({
    queryKey: seatQueryKeys.allocationByType(eventId),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: SeatAllocationByType }>(
        `/organizer-dashboard/events/${eventId}/seats/by-type`,
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!eventId,
  });
}

// Hook: Get seat operations history
export function useSeatOperations(eventId: string, limit: number = 20) {
  return useQuery({
    queryKey: [...seatQueryKeys.operations(eventId), limit],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: { operations: SeatOperation[] } }>(
        `/organizer-dashboard/events/${eventId}/seats/operations`,
        {
          params: { limit },
        },
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!eventId,
  });
}

// Hook: Get seats for a specific registration
export function useRegistrationSeats(registrationId: string) {
  return useQuery({
    queryKey: seatQueryKeys.registrationSeats(registrationId),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          registrationId: string;
          seats: RegistrationSeat[];
          seatCount: number;
        };
      }>(`/registrations/${registrationId}/seats`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!registrationId,
  });
}

// Helper: Invalidate seat queries for an event
export function invalidateSeatQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  eventId?: string,
  registrationId?: string,
) {
  if (eventId) {
    queryClient.invalidateQueries({
      queryKey: seatQueryKeys.allocationSummary(eventId),
    });
    queryClient.invalidateQueries({
      queryKey: seatQueryKeys.allocations(eventId),
    });
    queryClient.invalidateQueries({
      queryKey: seatQueryKeys.allocationByType(eventId),
    });
    queryClient.invalidateQueries({
      queryKey: seatQueryKeys.operations(eventId),
    });
  }

  if (registrationId) {
    queryClient.invalidateQueries({
      queryKey: seatQueryKeys.registrationSeats(registrationId),
    });
  }
}
