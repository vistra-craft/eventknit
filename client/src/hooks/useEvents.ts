/**
 * Events Hook
 * Provides functionality for fetching and managing multiple events
 */

import { useState, useCallback, useEffect } from 'react';
import * as eventApi from '../lib/event-api';
import type { EventData } from '../types/event';
import type { EventFilters } from '../lib/event-api';

interface UseEventsState {
  events: EventData[];
  isLoading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
}

interface UseEventsReturn extends UseEventsState {
  fetchEvents: (filters?: EventFilters) => Promise<void>;
  refreshEvents: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing multiple events
 */
export const useEvents = (initialFilters?: EventFilters): UseEventsReturn => {
  const [state, setState] = useState<UseEventsState>({
    events: [],
    isLoading: false,
    error: null,
    total: 0,
    hasMore: false,
  });

  const [filters, setFilters] = useState<EventFilters | undefined>(initialFilters);

  const fetchEvents = useCallback(async (newFilters?: EventFilters) => {
    const activeFilters = newFilters || filters;
    
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await eventApi.getEvents(activeFilters);

      if (response.success && response.data) {
        const { events, total, limit = 20 } = response.data;
        setState({
          events,
          isLoading: false,
          error: null,
          total,
          hasMore: (limit || 20) < total,
        });
      } else {
        throw new Error('Failed to fetch events');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to fetch events';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [filters]);

  const refreshEvents = useCallback(async () => {
    await fetchEvents(filters);
  }, [fetchEvents, filters]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Fetch events on mount if initialFilters provided
  useEffect(() => {
    if (initialFilters) {
      fetchEvents(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return {
    ...state,
    fetchEvents,
    refreshEvents,
    clearError,
  };
};

