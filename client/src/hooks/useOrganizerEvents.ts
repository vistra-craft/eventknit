import { useState, useEffect, useCallback } from "react";
import {
  getOrganizerEvents,
  getOrganizerUpcomingEvents,
  getOrganizerPastEvents,
  type OrganizerDashboardEvent,
} from "../lib/organizer-api";

export type EventView = "all" | "upcoming" | "past" | "cancelled";

interface UseOrganizerEventsOptions {
  view: EventView;
  initialLimit?: number;
}

interface UseOrganizerEventsReturn {
  events: OrganizerDashboardEvent[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  searchTerm: string;
  statusFilter: string;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  refetch: () => void;
}

export function useOrganizerEvents({
  view,
  initialLimit = 25,
}: UseOrganizerEventsOptions): UseOrganizerEventsReturn {
  const [events, setEvents] = useState<OrganizerDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fetchKey, setFetchKey] = useState(0);

  // Reset page, search, and filters when view changes
  useEffect(() => {
    setPage(1);
    setSearchTerm("");
    setStatusFilter("all");
  }, [view]);

  // Reset page when search or status filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;

      switch (view) {
        case "upcoming": {
          response = await getOrganizerUpcomingEvents({
            search: searchTerm || undefined,
            page,
            limit,
          });
          break;
        }
        case "past": {
          response = await getOrganizerPastEvents({
            search: searchTerm || undefined,
            page,
            limit,
          });
          break;
        }
        case "cancelled": {
          response = await getOrganizerEvents({
            status: "CANCELLED",
            search: searchTerm || undefined,
            page,
            limit,
          });
          break;
        }
        case "all":
        default: {
          const filters: {
            status?: string;
            search?: string;
            page?: number;
            limit?: number;
          } = { page, limit };

          if (statusFilter !== "all") {
            filters.status = statusFilter.toUpperCase();
          }
          if (searchTerm) {
            filters.search = searchTerm;
          }

          response = await getOrganizerEvents(filters);
          break;
        }
      }

      if (response.success && response.data) {
        setEvents(response.data.events as unknown as OrganizerDashboardEvent[]);
        if (response.data.totalPages !== undefined) {
          setTotalPages(response.data.totalPages);
        }
        if (response.data.total !== undefined) {
          setTotal(response.data.total);
        }
      } else {
        throw new Error(response.message || "Failed to fetch events");
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? (err.message as string)
          : "Failed to load events. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [view, searchTerm, statusFilter, page, limit, fetchKey]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return {
    events,
    loading,
    error,
    page,
    limit,
    totalPages,
    total,
    searchTerm,
    statusFilter,
    setPage,
    setLimit,
    setSearchTerm,
    setStatusFilter,
    refetch,
  };
}
