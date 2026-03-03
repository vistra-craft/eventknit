/**
 * useMyEvents Hook
 * Manages data for the unified My Events hub
 * Fetches attending, organizing, and saved events
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserRegisteredEvents } from '../lib/event-api';
import { getOrganizerEvents } from '../lib/organizer-api';
import { getSavedEvents } from '../lib/saved-events-api';
import { useAuth } from './useAuth';
import { UserRole } from '../types/auth';

export type MyEventsTab = 'attending' | 'organizing' | 'saved';

export interface AttendingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
}

export interface OrganizingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  status: string;
  isFree: boolean;
  attendees: number;
  capacity: number;
  revenue: number;
  views: number;
  conversion: string;
  image: string;
  description: string;
  category: string;
  ticketsSold?: number;
  checkedIn?: number;
}

export interface SavedEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  category?: string;
}

interface UseMyEventsReturn {
  // Data
  attendingEvents: AttendingEvent[];
  organizingEvents: OrganizingEvent[];
  savedEvents: SavedEvent[];

  // Loading states
  attendingLoading: boolean;
  organizingLoading: boolean;
  savedLoading: boolean;
  loading: boolean; // true if any are loading

  // Error states
  attendingError: string | null;
  organizingError: string | null;
  savedError: string | null;

  // Active tab
  activeTab: MyEventsTab;
  setActiveTab: (tab: MyEventsTab) => void;

  // Refresh functions
  refreshAttending: () => Promise<void>;
  refreshOrganizing: () => Promise<void>;
  refreshSaved: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Permissions
  canOrganize: boolean;
}

export const useMyEvents = (): UseMyEventsReturn => {
  const { user } = useAuth();

  // Check if user can organize
  // Now includes ATTENDEE users (who may have created pending events)
  const canOrganize = user?.role === UserRole.ATTENDEE ||
                     user?.role === UserRole.ORGANIZER ||
                     user?.role === UserRole.ORGANIZER_STAFF ||
                     user?.role === UserRole.ORGANIZER_TELLER;

  // State
  const [attendingEvents, setAttendingEvents] = useState<AttendingEvent[]>([]);
  const [organizingEvents, setOrganizingEvents] = useState<OrganizingEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);

  const [attendingLoading, setAttendingLoading] = useState(true);
  const [organizingLoading, setOrganizingLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);

  const [attendingError, setAttendingError] = useState<string | null>(null);
  const [organizingError, setOrganizingError] = useState<string | null>(null);
  const [savedError, setSavedError] = useState<string | null>(null);

  // Active tab - default to organizing if user can organize and has events
  const [activeTab, setActiveTab] = useState<MyEventsTab>('attending');

  // Fetch attending events
  const fetchAttending = useCallback(async () => {
    try {
      setAttendingLoading(true);
      setAttendingError(null);
      const response = await getUserRegisteredEvents({ page: 1, limit: 100 });
      if (response.success && response.data) {
        setAttendingEvents(response.data.events.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          type: event.type || 'In-Person',
          image: event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
          status: event.status || 'upcoming',
        })));
      }
    } catch (error) {
      console.error('Error fetching attending events:', error);
      setAttendingError('Failed to load attending events');
    } finally {
      setAttendingLoading(false);
    }
  }, []);

  // Fetch organizing events
  const fetchOrganizing = useCallback(async () => {
    if (!canOrganize) {
      setOrganizingEvents([]);
      setOrganizingLoading(false);
      return;
    }

    try {
      setOrganizingLoading(true);
      setOrganizingError(null);
      console.log('[useMyEvents] Fetching organizing events for user role:', user?.role);
      const response = await getOrganizerEvents({ limit: 100 });
      console.log('[useMyEvents] Organizing events response:', response);
      if (response.success && response.data) {
        const mappedEvents = response.data.events.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date || '',
          time: event.time || '',
          location: event.location,
          venue: event.venue || event.location,
          status: event.status || 'draft',
          isFree: event.isFree ?? true,
          attendees: event.attendees || 0,
          capacity: event.capacity || 0,
          revenue: (event as unknown as Record<string, unknown>).revenue as number || 0,
          views: (event as unknown as Record<string, unknown>).views as number || 0,
          conversion: (event as unknown as Record<string, unknown>).conversion as string || '0%',
          image: event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
          description: event.description,
          category: event.category || '',
          ticketsSold: event.attendees || 0,
          checkedIn: Math.floor((event.attendees || 0) * 0.7), // Estimate for now
        }));
        console.log('[useMyEvents] Mapped organizing events:', mappedEvents);
        setOrganizingEvents(mappedEvents);
      } else {
        console.warn('[useMyEvents] No organizing events data:', response);
      }
    } catch (error) {
      console.error('Error fetching organizing events:', error);
      setOrganizingError('Failed to load organizing events');
    } finally {
      setOrganizingLoading(false);
    }
  }, [canOrganize, user?.role]);

  // Fetch saved events
  const fetchSaved = useCallback(async () => {
    try {
      setSavedLoading(true);
      setSavedError(null);
      const response = await getSavedEvents({ page: 1, limit: 100 });
      if (response.success && response.data) {
        setSavedEvents(
          response.data.map((savedEvent) => {
            const event = savedEvent.event;
            return {
              id: event.id,
              title: event.title,
              date: event.startDate,
              location: event.location || '',
              type: event.eventType || 'In-Person',
              image:
                event.coverImage ||
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
              category: event.category || undefined,
            };
          }),
        );
      }
    } catch (error) {
      console.error('Error fetching saved events:', error);
      setSavedError('Failed to load saved events');
    } finally {
      setSavedLoading(false);
    }
  }, []);

  // Refresh functions
  const refreshAttending = useCallback(async () => {
    await fetchAttending();
  }, [fetchAttending]);

  const refreshOrganizing = useCallback(async () => {
    await fetchOrganizing();
  }, [fetchOrganizing]);

  const refreshSaved = useCallback(async () => {
    await fetchSaved();
  }, [fetchSaved]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchAttending(), fetchOrganizing(), fetchSaved()]);
  }, [fetchAttending, fetchOrganizing, fetchSaved]);

  // Initial fetch
  useEffect(() => {
    fetchAttending();
    if (canOrganize) {
      fetchOrganizing();
    }
    fetchSaved();
  }, [fetchAttending, fetchOrganizing, fetchSaved, canOrganize]);

  const loading = attendingLoading || organizingLoading || savedLoading;

  return {
    // Data
    attendingEvents,
    organizingEvents,
    savedEvents,

    // Loading states
    attendingLoading,
    organizingLoading,
    savedLoading,
    loading,

    // Error states
    attendingError,
    organizingError,
    savedError,

    // Active tab
    activeTab,
    setActiveTab,

    // Refresh functions
    refreshAttending,
    refreshOrganizing,
    refreshSaved,
    refreshAll,

    // Permissions
    canOrganize,
  };
};
