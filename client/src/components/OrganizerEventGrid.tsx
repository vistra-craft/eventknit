import OrganizerEventCard from "./OrganizerEventCard";
import { useState, useCallback, useEffect } from "react";
import { Calendar, Sparkles, TrendingUp } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { EventStatus } from "@/lib/event-api";

export const OrganizerEventGrid = () => {
  const [selectedFilter, setSelectedFilter] = useState("today");
  const { user } = useAuth();
  
  // Fetch events for the logged-in organizer
  const { events, isLoading, error, fetchEvents, clearError } = useEvents();

  const timeFilters = [
    { id: "today", label: "Today" },
    { id: "weekend", label: "This Weekend" },
    { id: "month", label: "Next 30 Days" }
  ];

  const handleFilterChange = useCallback(async (filterId: string) => {
    setSelectedFilter(filterId);
    clearError();

    // Build filters for organizer's events
    const filters: { organizerId?: string; status?: EventStatus; limit?: number } = {
      limit: 20,
    };

    // Only fetch events for the logged-in organizer
    if (user?.id) {
      filters.organizerId = user.id;
    }

    // Map filter IDs to status filters
    if (filterId === "today") {
      // TODO: Add date filter when backend supports it
      filters.status = EventStatus.APPROVED;
    } else if (filterId === "weekend") {
      filters.status = EventStatus.APPROVED;
    } else if (filterId === "month") {
      filters.status = EventStatus.APPROVED;
    }

    await fetchEvents(filters);
  }, [user?.id, fetchEvents, clearError]);

  // Fetch events on mount
  useEffect(() => {
    if (user?.id) {
      handleFilterChange("today");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <section className="py-16 bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full transform -translate-x-16 -translate-y-16"></div>
      <div className="absolute top-20 right-0 w-24 h-24 bg-primary/5 rounded-full transform translate-x-12 -translate-y-12"></div>
      <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-primary/5 rounded-full transform -translate-y-10"></div>
      
      <div className="container mx-auto px-6 relative">
        <div className="mb-12">
          {/* Centered title */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-foreground">
              My Events
            </h2>
          </div>
          
          {/* Bottom row with filters and info */}
          <div className="flex items-center justify-between">
            {/* Left side - Time Filter Selector */}
            <div className="bg-muted/50 rounded-full p-1 flex gap-1 shadow-sm border border-border/50">
              {timeFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterChange(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedFilter === filter.id
                      ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:scale-105'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Right side - Calendar icon, live events text, and trending badge */}
            <div className="flex items-center gap-6">
              {/* Calendar icon and live events text */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group">
                  <Calendar className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Live events happening now</span>
                </div>
              </div>
              
              {/* Trending badge */}
              <div className="flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
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
              <button
                onClick={() => handleFilterChange(selectedFilter)}
                className="mt-4 px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No events found</p>
            </div>
          ) : (
            events.map((event) => (
              <OrganizerEventCard 
                key={event.id} 
                event={{
                  id: event.id,
                  title: event.title,
                  image: event.image || '',
                  date: event.date || event.startDate,
                  time: event.time || event.startTime || '',
                  venue: event.venue || '',
                  location: event.location,
                  organizer: event.organizerName || '',
                  price: event.priceDisplay?.toString() || '0',
                  category: event.category || '',
                  description: event.description,
                  fullDescription: event.fullDescription || '',
                  duration: event.duration || '',
                  ageRestriction: event.ageRestriction || '',
                }} 
              />
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-200">
            Load More Events
          </button>
        </div>
      </div>
    </section>
  );
};
