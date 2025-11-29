import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";

// Mock data for related events since we don't have an API for it yet
// Using static data to match the "look like eventhub-details" requirement
const relatedEvents = [
  {
    id: 1,
    title: "Indie Rock Night",
    date: "Aug 5, 2024",
    location: "Brooklyn Bowl",
    category: "Live Music",
    price: "$45",
  },
  {
    id: 2,
    title: "Electronic Beats Festival",
    date: "Aug 12, 2024",
    location: "Pier 17",
    category: "Festival",
    price: "$79",
  },
];

export const RelatedEvents = () => {
  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold">You Might Also Like</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {relatedEvents.map((event, index) => (
          <div
            key={event.id}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col">
              <div className="relative h-48 overflow-hidden bg-muted">
                {/* Placeholder image since we don't have the assets */}
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-muted-foreground font-medium">Event Image</span>
                </div>
                <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                  {event.category}
                </Badge>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-primary">From {event.price}</span>
                  <span className="text-sm text-primary font-medium group-hover:underline">View Details →</span>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
};
