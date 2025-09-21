import { MapPin } from "lucide-react";

interface EventMapProps {
  venue: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const EventMap = ({ venue, location, coordinates }: EventMapProps) => {
  // In a real app, you would use a map library like Google Maps or Mapbox here
  // For now, we'll just show a placeholder with the address
  
  const mapUrl = coordinates 
    ? `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(venue + ' ' + location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="aspect-video bg-muted flex items-center justify-center">
        {coordinates ? (
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={mapUrl}
            title={`Map to ${venue}`}
            className="border-0"
          />
        ) : (
          <div className="text-center p-4">
            <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">{venue}</p>
            <p className="text-sm text-muted-foreground">{location}</p>
          </div>
        )}
      </div>
    </div>
  );
};
