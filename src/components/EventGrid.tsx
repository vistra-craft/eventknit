import { EventCard } from "./EventCard";
import { events } from "@/data/events";

// events are imported from shared data source

export const EventGrid = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Trending Events
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the hottest events happening around you. From concerts to comedy shows, we've got something for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-gradient-primary text-primary-foreground rounded-lg font-semibold hover:shadow-glow transition-all duration-200">
            Load More Events
          </button>
        </div>
      </div>
    </section>
  );
};