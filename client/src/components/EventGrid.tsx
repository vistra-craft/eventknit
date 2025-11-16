import { EventCard } from "./EventCard";
import { useState, useCallback, useEffect } from "react";
import { Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/useEvents";
import { formatEventDate } from "@/lib/event-utils";
import { EventStatus } from "@/lib/event-api";

export const EventGrid = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Get events based on filter
  const { events, isLoading, error, fetchEvents, clearError } = useEvents();

  const timeFilters = [
    { id: "all", label: "All" },
    { id: "weekend", label: "This Weekend" },
    { id: "month", label: "Next 30 Days" }
  ];

  const handleFilterChange = useCallback(async (filterId: string) => {
    setSelectedFilter(filterId);
    clearError();

    // Build filters based on selected filter
    const filters: { status?: EventStatus; limit?: number } = {
      limit: 20,
    };

    // Map filter IDs to API filters
    if (filterId === "all") {
      filters.status = EventStatus.APPROVED; // Only show approved events
    } else if (filterId === "weekend") {
      // TODO: Add date range filter when backend supports it
      filters.status = EventStatus.APPROVED;
    } else if (filterId === "month") {
      // TODO: Add date range filter when backend supports it
      filters.status = EventStatus.APPROVED;
    }

    await fetchEvents(filters);
  }, [fetchEvents, clearError]);

  // Fetch events on mount
  useEffect(() => {
    handleFilterChange("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          ) : events.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No events found</p>
            </div>
          ) : (
            events.map((event) => (
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
            Showing {events.length} events
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
