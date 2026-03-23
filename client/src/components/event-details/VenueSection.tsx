import { MapPin, Navigation, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventMap } from '@/components/events/EventMap';
import { getVenueType } from "@/types/event";

interface VenueSectionProps {
  venue?: string | null;
  location: string;
  address?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  isOnline?: boolean;
  onlineLink?: string | null;
}

export const VenueSection = ({ venue, location, address, coordinates, isOnline, onlineLink }: VenueSectionProps) => {
  const venueType = getVenueType({ isOnline, venue, onlineLink });

  const handleGetDirections = () => {
    const query = encodeURIComponent(`${venue ? venue + ', ' : ''}${location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Online-only: show info card, no map
  if (venueType === 'online') {
    return (
      <section>
        <h2 className="text-page-title mb-4">Event Access</h2>
        <div className="overflow-hidden rounded-2xl border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-section-header mb-2">Online Event</h3>
              <p className="text-sm text-muted-foreground">
                The event link will be shared with registered attendees via email and in your ticket.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // In-person and hybrid: show map + venue
  return (
    <section>
      <h2 className="text-page-title mb-4">Venue Information</h2>

      <div className="overflow-hidden rounded-2xl">
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
          <h3 className="text-section-header mb-2">{venue || 'Event Location'}</h3>
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm">{location}</p>
              {address && <p className="text-sm mt-1">{address}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Hybrid: also available online notice */}
      {venueType === 'hybrid' && (
        <div className="mt-4 p-4 rounded-xl border border-border bg-primary/5 flex items-start gap-3">
          <Globe className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Also available online</p>
            <p className="text-sm text-muted-foreground">
              The online event link will be shared with registered attendees after registration.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};