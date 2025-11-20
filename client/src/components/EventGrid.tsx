import { EventCard } from "./EventCard";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/useEvents";
import { formatEventDate } from "@/lib/event-utils";
import { EventStatus } from "@/lib/event-api";
import type { EventData } from "@/types/event";

interface EventGridProps {
  searchFilters?: {
    search?: string;
    location?: string;
  };
  categoryFilter?: string;
}

export const EventGrid = ({ searchFilters, categoryFilter }: EventGridProps = {}) => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Get events based on filter
  const { events: fetchedEvents, isLoading, error, fetchEvents, clearError } = useEvents();

  const timeFilters = [
    { id: "all", label: "All" },
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "Next 30 Days" }
  ];

  // Filter events by date range
  const dateFilteredEvents = useMemo(() => {
    if (selectedFilter === "all") {
      return fetchedEvents;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    let startDate: Date;
    let endDate: Date;

    switch (selectedFilter) {
      case "today": {
        startDate = new Date(now);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999); // End of today
        break;
      }
      case "week": {
        startDate = new Date(now);
        // Get start of week (Sunday)
        const dayOfWeek = now.getDay();
        startDate.setDate(now.getDate() - dayOfWeek);
        // End of week (Saturday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case "month": {
        startDate = new Date(now);
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 30);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      default:
        return fetchedEvents;
    }

    return fetchedEvents.filter((event) => {
      const eventStartDate = new Date(event.startDate);
      return eventStartDate >= startDate && eventStartDate <= endDate;
    });
  }, [fetchedEvents, selectedFilter]);

  const handleFilterChange = useCallback(async (filterId: string) => {
    setSelectedFilter(filterId);
    clearError();

    // Build filters based on selected filter
    const filters: { status?: EventStatus; limit?: number; search?: string; category?: string } = {
      limit: 100, // Fetch more events to allow client-side date filtering
    };

    // Always show approved events
    filters.status = EventStatus.APPROVED;

    // Add category filter if provided
    if (categoryFilter && categoryFilter !== "all") {
      // Handle "featured" category specially - this might need backend support
      // For now, we'll filter it client-side if needed
      if (categoryFilter !== "featured") {
        filters.category = categoryFilter;
      }
    }

    // Add search filters if provided
    // Note: Backend search parameter can include location in the search string
    if (searchFilters?.search || searchFilters?.location) {
      const searchParts: string[] = [];
      if (searchFilters.search) {
        searchParts.push(searchFilters.search);
      }
      if (searchFilters.location) {
        searchParts.push(searchFilters.location);
      }
      filters.search = searchParts.join(" ");
    }

    await fetchEvents(filters);
  }, [fetchEvents, clearError, searchFilters, categoryFilter]);

  // Filter events by category (client-side for "featured" category)
  const categoryFilteredEvents = useMemo(() => {
    if (!categoryFilter || categoryFilter === "all") {
      return dateFilteredEvents;
    }

    if (categoryFilter === "featured") {
      // Featured events could be events with specific tags or high ratings
      // For now, we'll show all events (backend can implement featured logic later)
      return dateFilteredEvents;
    }

    return dateFilteredEvents.filter((event) => 
      event.category?.toLowerCase() === categoryFilter.toLowerCase()
    );
  }, [dateFilteredEvents, categoryFilter]);

  const displayEvents = categoryFilteredEvents;

  // Fetch events on mount and when search filters or category change
  useEffect(() => {
    handleFilterChange(selectedFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilters, categoryFilter]);

  return (
    <section className="py-16 bg-background relative overflow-hidden" data-section="events">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full transform -translate-x-16 -translate-y-16"></div>
      <div className="absolute top-20 right-0 w-24 h-24 bg-primary/5 rounded-full transform translate-x-12 -translate-y-12"></div>
      <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-primary/5 rounded-full transform -translate-y-10"></div>
      
      <div className="container mx-auto px-6 relative">
        <div className="mb-12">
          {/* Centered title */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-foreground">
              Discover Events
            </h2>
          </div>
          
          {/* Bottom row with filters and info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left side - Time Filter Selector */}
            <div className="bg-primary/5 rounded-full p-1 flex gap-1 shadow-sm border border-border/50 w-full sm:w-auto overflow-x-auto sm:overflow-visible scrollbar-hide">
              {timeFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterChange(filter.id)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    selectedFilter === filter.id
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : 'text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:scale-105'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Right side - Calendar icon, live events text, and trending badge */}
            <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto justify-end sm:justify-start">
              {/* Calendar icon and live events text */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center group flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-pulse flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    <span className="hidden sm:inline">Live events happening now</span>
                    <span className="sm:hidden">Live now</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading events...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                onClick={() => handleFilterChange(selectedFilter)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : displayEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No events found</p>
            </div>
          ) : (
            displayEvents.map((event) => (
              <EventCard 
                key={event.id} 
                id={event.id}
                title={event.title}
                image={event.image || ''}
                date={event.date || formatEventDate(event.startDate)}
                time={event.time || event.startTime || ''}
                venue={event.venue || ''}
                location={event.location}
                organizer={event.organizerName || event.organizer?.organizationName || ''}
                price={event.priceDisplay?.toString() || '0'}
                category={event.category || ''}
              />
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <div className="text-sm text-muted-foreground mb-4">
            Showing {displayEvents.length} events
          </div>
          <Button 
            variant="outline" 
            className="hover:bg-eventknit hover:text-eventknit-foreground hover:border-eventknit"
          >
            <Calendar className="w-4 h-4 mr-2" />
            View All Events
          </Button>
        </div>
      </div>
    </section>
  );
};
