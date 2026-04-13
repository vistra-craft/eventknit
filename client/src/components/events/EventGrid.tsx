import { useEffect, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { EventCard } from "./EventCard";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { useEvents } from "@/hooks/useEvents";
import { EventStatus, EventType, type EventFilters } from "@/lib/event-api";
import type { SearchFilters } from "./EventSearchFilter";
import { getVenueType } from "@/types/event";
import { EASE } from "@/lib/animation-constants";

const PAGE_SIZE = 20;

/** Skeleton that mirrors EventCard structure exactly */
function EventCardSkeleton({ index = 0 }: { index?: number }) {
  const imgHeight = "h-56 sm:h-64";

  return (
    <div
      className="rounded-2xl overflow-hidden border border-border/40 bg-card"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Accent strip */}
      <div className="h-[2px] bg-gradient-to-r from-muted-foreground/10 via-muted-foreground/5 to-transparent" />

      {/* Image placeholder with shimmer */}
      <div className={`relative ${imgHeight} bg-muted overflow-hidden`}>
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, transparent 0%, hsl(var(--muted-foreground) / 0.04) 50%, transparent 100%)",
            animation: "skeleton-shimmer 1.5s ease-in-out infinite",
            animationDelay: `${index * 100}ms`,
          }}
        />
        {/* Price badge placeholder */}
        <div className="absolute top-3 right-3 w-10 h-5 rounded-md bg-muted-foreground/10 animate-pulse" />
      </div>

      {/* Content placeholder */}
      <div className="p-4 space-y-2.5">
        {/* Date line */}
        <div
          className="h-3 rounded w-28 bg-orange-500/10 dark:bg-orange-400/10 animate-pulse"
          style={{ animationDelay: `${index * 100 + 100}ms` }}
        />
        {/* Title lines */}
        <div className="space-y-1.5">
          <div
            className="h-4 rounded bg-muted-foreground/8 animate-pulse"
            style={{ width: `${65 + (index % 3) * 10}%`, animationDelay: `${index * 100 + 200}ms` }}
          />
        </div>
        {/* Venue line */}
        <div
          className="h-3 rounded bg-muted-foreground/6 animate-pulse"
          style={{ width: `${50 + (index % 4) * 8}%`, animationDelay: `${index * 100 + 300}ms` }}
        />
      </div>
    </div>
  );
}

interface EventGridProps {
  filters?: SearchFilters;
}

export const EventGrid = ({ filters = {} }: EventGridProps) => {
  const {
    events: fetchedEvents,
    error,
    fetchEvents,
    loadMore,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
  } = useEvents();

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sentinelInView = useInView(sentinelRef, { margin: "100px" });

  // Fetch when filters change (resets to page 1)
  useEffect(() => {
    const fetchFilters: EventFilters = {
      status: EventStatus.APPROVED,
      type: EventType.PUBLIC,
      limit: PAGE_SIZE,
    };
    if (filters.search) fetchFilters.search = filters.search;
    if (filters.category && filters.category !== "all") fetchFilters.category = filters.category;
    // Push price filter to backend
    if (filters.priceRange === "free") fetchFilters.isFree = true;
    if (filters.priceRange === "paid") fetchFilters.isFree = false;
    // Push date range to backend
    if (filters.dateRange && filters.dateRange !== "anytime") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      fetchFilters.dateFrom = today.toISOString();

      switch (filters.dateRange) {
        case "today": {
          const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
          fetchFilters.dateTo = tomorrow.toISOString();
          break;
        }
        case "tomorrow": {
          const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
          const da = new Date(tmr); da.setDate(da.getDate() + 1);
          fetchFilters.dateFrom = tmr.toISOString();
          fetchFilters.dateTo = da.toISOString();
          break;
        }
        case "this-week": {
          const eow = new Date(today); eow.setDate(today.getDate() + (6 - today.getDay())); eow.setHours(23, 59, 59, 999);
          fetchFilters.dateTo = eow.toISOString();
          break;
        }
        case "this-weekend": {
          const fri = new Date(today); fri.setDate(today.getDate() + (5 - today.getDay()));
          const sun = new Date(today); sun.setDate(today.getDate() + (7 - today.getDay())); sun.setHours(23, 59, 59, 999);
          fetchFilters.dateFrom = fri.toISOString();
          fetchFilters.dateTo = sun.toISOString();
          break;
        }
        case "next-week": {
          const snw = new Date(today); snw.setDate(today.getDate() + (7 - today.getDay()));
          const enw = new Date(snw); enw.setDate(snw.getDate() + 6); enw.setHours(23, 59, 59, 999);
          fetchFilters.dateFrom = snw.toISOString();
          fetchFilters.dateTo = enw.toISOString();
          break;
        }
        case "next-month": {
          const nm = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const enm = new Date(today.getFullYear(), today.getMonth() + 2, 0); enm.setHours(23, 59, 59, 999);
          fetchFilters.dateFrom = nm.toISOString();
          fetchFilters.dateTo = enm.toISOString();
          break;
        }
      }
    }

    fetchEvents(fetchFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category, filters.dateRange, filters.priceRange]);

  // Trigger loadMore when sentinel enters viewport
  // Uses a ref to avoid dependency loops and a timeout to debounce rapid fires
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sentinelInView) return;

    // Debounce: wait 300ms after sentinel enters view before firing
    // This prevents rapid-fire on fast scrolls and page transitions
    if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
    loadMoreTimeoutRef.current = setTimeout(() => {
      loadMoreRef.current();
    }, 300);

    return () => {
      if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelInView]);

  // Client-side filters that backend doesn't support
  const filteredEvents = useMemo(() => {
    if (!fetchedEvents) return [];

    return fetchedEvents.filter((event) => {
      // Location (backend doesn't filter by location text)
      if (filters.location) {
        const term = filters.location.toLowerCase();
        const loc = (event.location || "").toLowerCase();
        const ven = (event.venue || "").toLowerCase();
        if (!loc.includes(term) && !ven.includes(term)) return false;
      }

      // Event type
      if (filters.eventType && filters.eventType !== "all") {
        const venueType = getVenueType(event);
        if (filters.eventType === "online" && venueType !== "online") return false;
        if (filters.eventType === "in-person" && venueType !== "in-person") return false;
        if (filters.eventType === "hybrid" && venueType !== "hybrid") return false;
      }

      // Tags
      if (filters.tags && filters.tags.length > 0) {
        const eventTags = (event.tags || []).map((t) => t.toLowerCase());
        if (!filters.tags.every((ft) => eventTags.some((et) => et.includes(ft.toLowerCase())))) return false;
      }

      // Hide ended events
      {
        const now = new Date();
        if (event.endDate) {
          const end = new Date(event.endDate);
          end.setHours(23, 59, 59, 999);
          if (end < now) return false;
        } else {
          const start = new Date(event.startDate);
          const endOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
          if (endOfDay < now) return false;
        }
      }

      return true;
    });
  }, [fetchedEvents, filters]);


  return (
    <section className="pt-4 pb-16 bg-background" data-section="events">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <AnimatedSection className="mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Upcoming Events</h2>
            {!isLoading && total > 0 && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <EventCardSkeleton key={i} index={i} />
            ))
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-destructive mb-2">{error}</p>
              <Button
                variant="outline"
                onClick={() => fetchEvents({ status: EventStatus.APPROVED, type: EventType.PUBLIC, limit: PAGE_SIZE })}
                className="border border-border hover:bg-muted transition-colors"
              >
                Try Again
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No events available yet. Check back soon.</p>
            </div>
          ) : (
            filteredEvents.map((event, index) => {
              const isFree = event.isFree || event.priceDisplay === 0;
              const hasNumericPrice = typeof event.priceDisplay === "number" && event.priceDisplay > 0;
              const price = isFree ? "Free" : hasNumericPrice ? event.priceDisplay!.toString() : "See tickets";
              const currency = isFree || !hasNumericPrice ? undefined : event.currency || "$";
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, ease: EASE, delay: (index % 4) * 0.08 }}
                >
                  <EventCard
                    id={event.id}
                    slug={event.slug}
                    title={event.title}
                    image={event.image || ""}
                    startDate={event.startDate}
                    endDate={event.endDate || undefined}
                    startTime={event.startTime || undefined}
                    endTime={event.endTime || undefined}
                    venue={event.venue || ""}
                    location={event.location}
                    price={price}
                    currency={currency}
                    isOnline={event.isOnline}
                    onlineLink={event.onlineLink}
                    category={event.category}
                  />
                </motion.div>
              );
            })
          )}
        </div>

        {/* Loading more skeletons */}
        {isLoadingMore && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={`more-${i}`} index={i} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-px" />

        {/* End of results */}
        {!hasMore && !isLoading && filteredEvents.length > 0 && filteredEvents.length >= PAGE_SIZE && (
          <p className="text-center text-xs text-muted-foreground pt-8">
            Showing all {total} events
          </p>
        )}
      </div>
    </section>
  );
};
