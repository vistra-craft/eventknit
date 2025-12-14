import { EventCard } from "@/components/EventCard";
import { useEffect, useState } from "react";
import { getEvents, EventStatus } from "@/lib/event-api";
import type { EventData } from "@/types/event";
import { Loader2 } from "lucide-react";

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
        
        // Build filters - try tags first, then category, then just approved events
        const filters: any = {
          status: EventStatus.APPROVED,
          limit: 20, // Fetch more to filter out current event
        };
        
        // Add tags filter if we have tags
        if (tags && tags.length > 0) {
          filters.tags = tags;
        }
        // Add category filter if we have category (and no tags, or as fallback)
        if (category) {
          filters.category = category;
        }
        
        console.log('[RelatedEvents] Fetching with filters:', filters);
        
        const response = await getEvents(filters);

        console.log('[RelatedEvents] Response:', {
          success: response.success,
          eventCount: response.data?.events?.length || 0,
          events: response.data?.events?.map(e => ({ id: e.id, title: e.title, tags: e.tags, category: e.category })) || []
        });

        if (response.success && response.data.events) {
          // Filter out the current event
          let filtered = response.data.events.filter((event) => event.id !== currentEventId);
          
          console.log('[RelatedEvents] After filtering current event:', filtered.length);
          
          // If we have tags, prioritize events with matching tags
          if (tags && tags.length > 0) {
            // Sort: events with more matching tags first
            filtered = filtered.sort((a, b) => {
              const aTagMatches = a.tags?.filter(tag => tags.includes(tag)).length || 0;
              const bTagMatches = b.tags?.filter(tag => tags.includes(tag)).length || 0;
              if (bTagMatches !== aTagMatches) {
                return bTagMatches - aTagMatches;
              }
              // If same tag matches, prefer same category
              if (category) {
                if (a.category === category && b.category !== category) return -1;
                if (b.category === category && a.category !== category) return 1;
              }
              return 0;
            });
          } else if (category) {
            // If no tags but have category, prioritize same category
            filtered = filtered.sort((a, b) => {
              if (a.category === category && b.category !== category) return -1;
              if (b.category === category && a.category !== category) return 1;
              return 0;
            });
          }
          
          // Limit to 4 events
          const finalEvents = filtered.slice(0, 4);
          console.log('[RelatedEvents] Final events to display:', finalEvents.length);
          setRelatedEvents(finalEvents);
        } else {
          console.log('[RelatedEvents] No events found or response failed');
          setRelatedEvents([]);
        }
      } catch (error) {
        console.error("Error fetching related events:", error);
        setRelatedEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentEventId) {
      fetchRelatedEvents();
    }
  }, [currentEventId, category, tags]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">You Might Also Like</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (relatedEvents.length === 0) {
    return null; // Don't show section if no related events
  }

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold">You Might Also Like</h2>
      
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
    </section>
  );
};

