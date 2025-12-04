/**
 * Events Hook
 * Provides functionality for fetching and managing multiple events
 */

import { useState, useCallback, useEffect, useRef } from 'react';
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

  const [filters] = useState<EventFilters | undefined>(initialFilters);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Reset on mount (important for StrictMode double-mounting)
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchEvents = useCallback(async (newFilters?: EventFilters) => {
    const activeFilters = newFilters || filters;
    
    try {
      if (!isMountedRef.current) return;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      console.log('[useEvents] Fetching events with filters:', activeFilters);
      const response = await eventApi.getEvents(activeFilters);
      console.log('[useEvents] API response received:', {
        success: response.success,
        hasData: !!response.data,
        eventCount: response.data?.events?.length || 0
      });

      if (!isMountedRef.current) {
        console.log('[useEvents] Component unmounted, not updating state');
        return;
      }
      
      if (response.success && response.data) {
        const { events, total, limit = 20 } = response.data;
        console.log('[useEvents] Setting state with events:', events.length);
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
      if (!isMountedRef.current) return;
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to fetch events';
      console.error('[useEvents] Error fetching events:', errorMessage);
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

