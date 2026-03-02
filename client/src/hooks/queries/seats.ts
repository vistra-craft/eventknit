import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSeatAllocationSummary,
  getSeatAllocations,
  getSeatAllocationByType,
  getSeatOperations,
  getRegistrationSeats,
} from '@/lib/seating-api';

export type {
  SeatAllocationSummary,
  SeatAllocation,
  SeatAllocationByType,
  SeatOperation,
  RegistrationSeat,
} from '@/lib/seating-api';

// Query key factory for seat queries
export const seatQueryKeys = {
  all: ['seats'] as const,
  allocationSummary: (eventId: string) => [...seatQueryKeys.all, 'summary', eventId] as const,
  allocations: (eventId: string) => [...seatQueryKeys.all, 'allocations', eventId] as const,
  allocationByType: (eventId: string) => [...seatQueryKeys.all, 'by-type', eventId] as const,
  operations: (eventId: string) => [...seatQueryKeys.all, 'operations', eventId] as const,
  registrationSeats: (registrationId: string) => [...seatQueryKeys.all, 'registration', registrationId] as const,
};

// Hook: Get seat allocation summary
export function useSeatAllocationSummary(eventId: string) {
  return useQuery({
    queryKey: seatQueryKeys.allocationSummary(eventId),
    queryFn: () => getSeatAllocationSummary(eventId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
    queryFn: () => getSeatAllocations(eventId, page, limit, statusFilter),
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
    queryFn: () => getSeatAllocationByType(eventId),
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
    queryFn: () => getSeatOperations(eventId, limit),
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
    queryFn: () => getRegistrationSeats(registrationId),
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
    queryClient.invalidateQueries({ queryKey: seatQueryKeys.allocationSummary(eventId) });
    queryClient.invalidateQueries({ queryKey: seatQueryKeys.allocations(eventId) });
    queryClient.invalidateQueries({ queryKey: seatQueryKeys.allocationByType(eventId) });
    queryClient.invalidateQueries({ queryKey: seatQueryKeys.operations(eventId) });
  }

  if (registrationId) {
    queryClient.invalidateQueries({ queryKey: seatQueryKeys.registrationSeats(registrationId) });
  }
}
