import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents, EventStatus, EventType } from "@/lib/event-api";
import type { EventData } from "@/types/event";
import { Loader } from "@/components/ui/loader";
import { EventImage } from "@/components/EventImage";

interface RelatedEventsSimpleProps {
  currentEventId?: string;
  category?: string | null;
  tags?: string[] | null;
  organizerId?: string;
}

export const RelatedEventsSimple = ({ 
  currentEventId, 
  category, 
  tags,
  organizerId 
}: RelatedEventsSimpleProps) => {
  const [relatedEvents, setRelatedEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRelatedEvents = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch events by category first
        let response;
        if (category) {
          response = await getEvents({
            status: EventStatus.APPROVED,
            category: category,
            type: EventType.PUBLIC,
            limit: 20,
          });
        } else if (organizerId) {
          // If no category, try by organizer
          response = await getEvents({
            status: EventStatus.APPROVED,
            organizerId: organizerId,
            type: EventType.PUBLIC,
            limit: 20,
          });
        } else {
          // Fallback to general approved events
          response = await getEvents({
            status: EventStatus.APPROVED,
            type: EventType.PUBLIC,
            limit: 20,
          });
        }

        if (response.success && response.data.events) {
          // Filter out the current event and prioritize events with matching tags
          let filtered = response.data.events.filter((event) => event.id !== currentEventId);
          
          // If we have tags, prioritize events with matching tags
          if (tags && tags.length > 0) {
            filtered = filtered.sort((a, b) => {
              const aTagMatches = a.tags?.filter(tag => tags.includes(tag)).length || 0;
              const bTagMatches = b.tags?.filter(tag => tags.includes(tag)).length || 0;
              return bTagMatches - aTagMatches;
            });
          }
          
          // Limit to 3 events
          setRelatedEvents(filtered.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching related events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentEventId) {
      fetchRelatedEvents();
    }
  }, [currentEventId, category, tags, organizerId]);

  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-bold mb-6">More events you might like</h2>
        <div className="flex items-center justify-center py-8">
          <Loader />
        </div>
      </section>
    );
  }

  if (relatedEvents.length === 0) {
    return null; // Don't show section if no related events
  }

  return (
    <section className="py-8 border-t border-border/60">
      <h2 className="text-2xl font-bold mb-6">More events you might like</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {relatedEvents.map((event) => (
          <div
            key={event.id}
            onClick={() => navigate(`/event/${event.id}`)}
            className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-background shadow-sm hover:shadow-md hover:shadow-primary/5 hover:border-primary/30 transition-all duration-200"
          >
            {/* Event Image */}
            <div className="relative h-48 overflow-hidden">
              <EventImage
                src={event.image}
                alt={event.title}
                focalX={event.imageFocalX}
                focalY={event.imageFocalY}
                className="w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {event.category && (
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-muted/80 text-foreground backdrop-blur-sm rounded-full text-xs">
                    {event.category}
                  </span>
                </div>
              )}
            </div>
            
            {/* Event Title */}
            <div className="p-4">
              <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {event.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

