/**
 * Events Hook — paginated with infinite scroll support
 *
 * Fetches events page-by-page (default 20 per page). Exposes `loadMore()`
 * to append the next page. Resets to page 1 when filters change.
 */

import { useState, useCallback, useRef } from "react";
import * as eventApi from "../lib/event-api";
import type { EventData } from "../types/event";
import type { EventFilters } from "../lib/event-api";

const PAGE_SIZE = 20;

interface UseEventsState {
  events: EventData[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface UseEventsReturn extends UseEventsState {
  fetchEvents: (filters?: EventFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  clearError: () => void;
}

export const useEvents = (): UseEventsReturn => {
  const [state, setState] = useState<UseEventsState>({
    events: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
  });

  const isMountedRef = useRef(true);
  const lastFiltersRef = useRef<EventFilters | undefined>(undefined);
  const isLoadingRef = useRef(false);

  // Prevent unmounted state updates
  const safeSetState = useCallback((updater: (prev: UseEventsState) => UseEventsState) => {
    if (isMountedRef.current) setState(updater);
  }, []);

  /**
   * Fetch page 1 (resets the list). Called on mount and when filters change.
   */
  const fetchEvents = useCallback(async (filters?: EventFilters) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    lastFiltersRef.current = filters;

    safeSetState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await eventApi.getEvents({
        ...filters,
        page: 1,
        limit: filters?.limit ?? PAGE_SIZE,
      });

      if (response.success && response.data) {
        const { events, total, totalPages = 1 } = response.data;
        safeSetState(() => ({
          events,
          isLoading: false,
          isLoadingMore: false,
          error: null,
          total,
          page: 1,
          totalPages,
          hasMore: 1 < totalPages,
        }));
      } else {
        throw new Error("Failed to fetch events");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to fetch events";
      safeSetState((prev) => ({ ...prev, isLoading: false, error: msg }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [safeSetState]);

  /**
   * Load next page and append to existing events.
   */
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !state.hasMore) return;
    isLoadingRef.current = true;

    const nextPage = state.page + 1;
    safeSetState((prev) => ({ ...prev, isLoadingMore: true }));

    try {
      const response = await eventApi.getEvents({
        ...lastFiltersRef.current,
        page: nextPage,
        limit: lastFiltersRef.current?.limit ?? PAGE_SIZE,
      });

      if (response.success && response.data) {
        const { events: newEvents, totalPages = 1 } = response.data;
        safeSetState((prev) => ({
          ...prev,
          events: [...prev.events, ...newEvents],
          isLoadingMore: false,
          page: nextPage,
          totalPages,
          hasMore: nextPage < totalPages,
        }));
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to load more events";
      safeSetState((prev) => ({ ...prev, isLoadingMore: false, error: msg }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [state.hasMore, state.page, safeSetState]);

  /**
   * Re-fetch with the same filters (pull-to-refresh style).
   */
  const refreshEvents = useCallback(async () => {
    await fetchEvents(lastFiltersRef.current);
  }, [fetchEvents]);

  const clearError = useCallback(() => {
    safeSetState((prev) => ({ ...prev, error: null }));
  }, [safeSetState]);

  return {
    ...state,
    fetchEvents,
    loadMore,
    refreshEvents,
    clearError,
  };
};
