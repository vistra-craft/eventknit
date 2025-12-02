import { EventCard } from "./EventCard";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/useEvents";
import { EventStatus, type EventFilters } from "@/lib/event-api";
import type { SearchFilters } from "./EventSearchFilter";

interface EventGridProps {
  filters?: SearchFilters;
}

export const EventGrid = ({ filters = {} }: EventGridProps) => {
  // Get events - we fetch all approved events and filter client-side for advanced filters
  // that the backend doesn't support yet
  const { events: fetchedEvents, isLoading, error, fetchEvents } = useEvents();

  // Fetch events on mount and when basic filters change
  useEffect(() => {
    const fetchFilters: EventFilters = {
      status: EventStatus.APPROVED,
      limit: 100, // Fetch more events to allow client-side filtering
    };

    // Pass search and category to backend as they are supported
    if (filters.search) fetchFilters.search = filters.search;
    if (filters.category && filters.category !== 'all') fetchFilters.category = filters.category;

    fetchEvents(fetchFilters);
  }, [filters.search, filters.category, fetchEvents]);

  // Apply client-side filters
  const filteredEvents = useMemo(() => {
    if (!fetchedEvents) return [];

    return fetchedEvents.filter(event => {
      // 1. Location Filter
      if (filters.location) {
        const locationTerm = filters.location.toLowerCase();
        const eventLocation = (event.location || '').toLowerCase();
        const eventVenue = (event.venue || '').toLowerCase();
        if (!eventLocation.includes(locationTerm) && !eventVenue.includes(locationTerm)) {
          return false;
        }
      }

      // 2. Event Type Filter
      if (filters.eventType && filters.eventType !== 'all') {
        if (filters.eventType === 'online' && !event.isOnline) return false;
        if (filters.eventType === 'in-person' && event.isOnline) return false;
        // Hybrid logic could be added here if supported
      }

      // 3. Price Filter
      if (filters.priceRange && filters.priceRange !== 'any') {
        const price = typeof event.price === 'number' ? event.price : 0;
        const isFree = event.isFree || price === 0;

        switch (filters.priceRange) {
          case 'free':
            if (!isFree) return false;
            break;
          case 'under-25':
            if (price >= 25) return false;
            break;
          case '25-50':
            if (price < 25 || price > 50) return false;
            break;
          case '50-100':
            if (price < 50 || price > 100) return false;
            break;
          case '100-plus':
            if (price <= 100) return false;
            break;
        }
      }

      // 4. Date Range Filter
      if (filters.dateRange && filters.dateRange !== 'anytime') {
        const eventDate = new Date(event.startDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (filters.dateRange) {
          case 'today': {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (eventDate < today || eventDate >= tomorrow) return false;
            break;
          }
          case 'tomorrow': {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);
            if (eventDate < tomorrow || eventDate >= dayAfter) return false;
            break;
          }
          case 'this-week': {
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
            endOfWeek.setHours(23, 59, 59, 999);
            if (eventDate < today || eventDate > endOfWeek) return false;
            break;
          }
          case 'this-weekend': {
            const friday = new Date(today);
            friday.setDate(today.getDate() + (5 - today.getDay()));
            const sunday = new Date(today);
            sunday.setDate(today.getDate() + (7 - today.getDay()));
            sunday.setHours(23, 59, 59, 999);
            if (eventDate < friday || eventDate > sunday) return false;
            break;
          }
          case 'next-week': {
            const startNextWeek = new Date(today);
            startNextWeek.setDate(today.getDate() + (7 - today.getDay())); // Next Sunday
            const endNextWeek = new Date(startNextWeek);
            endNextWeek.setDate(startNextWeek.getDate() + 6);
            endNextWeek.setHours(23, 59, 59, 999);
            if (eventDate < startNextWeek || eventDate > endNextWeek) return false;
            break;
          }
          case 'next-month': {
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            const endNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            endNextMonth.setHours(23, 59, 59, 999);
            if (eventDate < nextMonth || eventDate > endNextMonth) return false;
            break;
          }
        }
      }

      return true;
    });
  }, [fetchedEvents, filters]);

  return (
    <section className="py-16 bg-background" data-section="events">
      <div className="container mx-auto px-6">


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
                onClick={() => fetchEvents({ status: EventStatus.APPROVED, limit: 100 })}
                className="mt-4 border border-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
              >
                Try Again
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No events found matching your filters</p>
              <Button 
                variant="link" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isFree = event.isFree || event.priceDisplay === 0;
              const hasNumericPrice = typeof event.priceDisplay === 'number' && event.priceDisplay > 0;

              const price = isFree
                ? 'Free'
                : hasNumericPrice
                  ? event.priceDisplay!.toString()
                  : 'See tickets';

              const currency = isFree || !hasNumericPrice
                ? undefined
                : event.currency || '$';

              return (
                <EventCard 
                  key={event.id} 
                  id={event.id}
                  title={event.title}
                  image={event.image || ''}
                  startDate={event.startDate}
                  endDate={event.endDate || undefined}
                  startTime={event.startTime || undefined}
                  endTime={event.endTime || undefined}
                  venue={event.venue || ''}
                  location={event.location}
                  price={price}
                  currency={currency}
                  category={event.category || ''}
                />
              );
            })
          )}
        </div>

        {/* Pagination / view-all section intentionally removed for infinite scroll experience */}
      </div>
    </section>
  );
};
