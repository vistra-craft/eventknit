import { MapPin, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventMap } from "@/components/EventMap";

interface VenueSectionProps {
  venue?: string | null;
  location: string;
  coordinates?: { lat: number; lng: number } | null;
}

export const VenueSection = ({ venue, location, coordinates }: VenueSectionProps) => {
  const handleGetDirections = () => {
    const query = encodeURIComponent(`${venue ? venue + ', ' : ''}${location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold">Venue Information</h2>
      
      <Card className="overflow-hidden border-border/50 shadow-md">
        {/* Map */}
        <div className="relative h-[300px] bg-muted">
          <EventMap 
            venue={venue || ''} 
            location={location} 
            coordinates={coordinates ?? undefined}
          />
          <Button 
            className="absolute top-4 right-4 shadow-lg z-10"
            variant="secondary"
            size="sm"
            onClick={handleGetDirections}
          >
            <Navigation className="mr-2 h-4 w-4" />
            Get Directions
          </Button>
        </div>

        {/* Venue Details */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2">{venue || 'Event Location'}</h3>
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{location}</p>
          </div>
        </div>
      </Card>
    </section>
  );
};
