interface EventMapProps {
  venue: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const EventMap = ({ venue, location, coordinates }: EventMapProps) => {
  // Build map URL — works with both coordinates and text-based search
  const mapUrl = coordinates
    ? `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent((venue + ' ' + location).trim())}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="aspect-video bg-muted">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          title={`Map to ${venue || location}`}
          className="border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};
