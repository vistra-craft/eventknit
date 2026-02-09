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
        
        // Fetch events with same category or tags
        const response = await getEvents({
          status: EventStatus.APPROVED,
          category: category,
          limit: 20, // Fetch more to filter out current event
        });

        if (response.success && response.data.events) {
          // Filter out the current event and limit to 4
          const filtered = response.data.events
            .filter((event) => event.id !== currentEventId)
            .slice(0, 4);
          
          setRelatedEvents(filtered);
        }
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
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">You Might Also Like</h2>
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
        </div>
      </section>
    );
  }

  if (relatedEvents.length === 0) {
    return null; // Don't show section if no related events
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">You Might Also Like</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    </section>
  );
};

