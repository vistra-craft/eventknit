/**
 * Event Hook
 * Provides functionality for fetching and managing a single event
 */

import { useState, useCallback, useEffect } from 'react';
import * as eventApi from '../lib/event-api';
import type { EventData } from '../types/event';
import type { CreateEventData, UpdateEventData, RegisterForEventData } from '../lib/event-api';

interface UseEventState {
  event: EventData | null;
  isLoading: boolean;
  error: string | null;
}

interface UseEventReturn extends UseEventState {
  fetchEvent: (id: string) => Promise<void>;
  createEvent: (data: CreateEventData) => Promise<EventData>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<EventData>;
  deleteEvent: (id: string) => Promise<void>;
  registerForEvent: (data: RegisterForEventData) => Promise<void>;
  refreshEvent: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing a single event
 */
export const useEvent = (eventId?: string): UseEventReturn => {
  const [state, setState] = useState<UseEventState>({
    event: null,
    isLoading: false,
    error: null,
  });

  const fetchEvent = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await eventApi.getEventById(id);

      if (response.success && response.data) {
        setState({
          event: response.data.event,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('Failed to fetch event');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to fetch event';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const createEvent = useCallback(async (data: CreateEventData): Promise<EventData> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await eventApi.createEvent(data);

      if (response.success && response.data) {
        const newEvent = response.data.event;
        setState((prev) => ({
          ...prev,
          event: newEvent,
          isLoading: false,
          error: null,
        }));
        return newEvent;
      } else {
        throw new Error(response.message || 'Failed to create event');
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to create event';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const updateEvent = useCallback(
    async (id: string, data: UpdateEventData): Promise<EventData> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await eventApi.updateEvent(id, data);

        if (response.success && response.data) {
          const updatedEvent = response.data.event;
          setState((prev) => ({
            ...prev,
            event: updatedEvent,
            isLoading: false,
            error: null,
          }));
          return updatedEvent;
        } else {
          throw new Error(response.message || 'Failed to update event');
        }
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error.message as string)
            : 'Failed to update event';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      await eventApi.deleteEvent(id);

      setState({
        event: null,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error.message as string)
          : 'Failed to delete event';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const registerForEvent = useCallback(
    async (data: RegisterForEventData): Promise<void> => {
      if (!state.event) {
        throw new Error('No event selected');
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        await eventApi.registerForEvent(state.event.id, data);

        // Refresh event to get updated registration counts
        await fetchEvent(state.event.id);
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error.message as string)
            : 'Failed to register for event';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [state.event, fetchEvent]
  );

  const refreshEvent = useCallback(async () => {
    if (eventId) {
      await fetchEvent(eventId);
    }
  }, [eventId, fetchEvent]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Fetch event on mount if eventId provided
  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]); // Fetch when eventId changes

  return {
    ...state,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    refreshEvent,
    clearError,
  };
};


