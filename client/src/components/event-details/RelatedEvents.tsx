import { EventCard } from "@/components/EventCard";
import { useEffect, useState } from "react";
import { getRelatedEvents } from "@/lib/event-api";
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
    if (!currentEventId) return;

    const fetchRelatedEvents = async () => {
      try {
        setIsLoading(true);
        const response = await getRelatedEvents(currentEventId, 8);

        if (response.success && response.data.events) {
          setRelatedEvents(response.data.events);
        }
      } catch (error) {
        console.error("Error fetching related events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedEvents();
  }, [currentEventId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (relatedEvents.length === 0) return null;

  // 4 or fewer on desktop: use grid
  const useGrid = relatedEvents.length <= 4;

  return (
<<<<<<< Updated upstream
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
=======
    <div>
      {useGrid ? (
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
                category={event.category || "Event"}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-4 px-4">
          {relatedEvents.map((event, index) => (
            <div
              key={event.id}
              className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 80}ms` }}
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
                category={event.category || "Event"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
>>>>>>> Stashed changes
  );
};
