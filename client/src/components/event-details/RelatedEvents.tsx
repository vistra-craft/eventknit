import { EventCard } from "@/components/EventCard";
import { useEffect, useState } from "react";
import { getEvents, EventStatus } from "@/lib/event-api";
import type { EventData } from "@/types/event";
import { Loader } from "@/components/ui/loader";

interface RelatedEventsProps {
  currentEventId?: string;
  category?: string;
  tags?: string[];
}

export const RelatedEvents = ({ currentEventId, category, tags }: RelatedEventsProps) => {
  const [relatedEvents, setRelatedEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedEvents = async () => {
      try {
        setIsLoading(true);

        let filtered: EventData[] = [];

        // First try: fetch events with same category
        if (category) {
          const response = await getEvents({
            status: EventStatus.APPROVED,
            category: category,
            limit: 20,
          });

          if (response.success && response.data?.events) {
            filtered = response.data.events
              .filter((event) => event.id !== currentEventId)
              .slice(0, 3);
          }
        }

        // Fallback: if no category match or no results, fetch all approved events
        // and prioritize by matching tags
        if (filtered.length === 0) {
          const fallbackResponse = await getEvents({
            status: EventStatus.APPROVED,
            limit: 20,
          });

          if (fallbackResponse.success && fallbackResponse.data?.events) {
            const otherEvents = fallbackResponse.data.events
              .filter((event) => event.id !== currentEventId);

            // Sort by number of matching tags (most relevant first)
            if (tags && tags.length > 0) {
              otherEvents.sort((a, b) => {
                const aMatches = (a.tags || []).filter((t) => tags.includes(t)).length;
                const bMatches = (b.tags || []).filter((t) => tags.includes(t)).length;
                return bMatches - aMatches;
              });
            }

            filtered = otherEvents.slice(0, 3);
          }
        }

        setRelatedEvents(filtered);
      } catch (error) {
        console.error("Error fetching related events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedEvents();
  }, [currentEventId, category, tags]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (relatedEvents.length === 0) {
    return null; // Don't show section if no related events
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedEvents.map((event, index) => (
          <div
            key={event.id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <EventCard
              id={event.id}
              title={event.title}
              image={event.image || ""}
              startDate={event.startDate}
              endDate={event.endDate || undefined}
              startTime={event.startTime || undefined}
              endTime={event.endTime || undefined}
              venue={event.venue || ""}
              location={event.location || ""}
              price={event.isFree ? "Free" : event.price ? event.price.toString() : "See tickets"}
              currency={event.isFree || !event.price ? undefined : event.currency || "$"}
            />
          </div>
        ))}
    </div>
  );
};

