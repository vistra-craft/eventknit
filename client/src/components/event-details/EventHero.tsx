import { Calendar, MapPin, Globe, Video, Heart, Share2 } from "lucide-react";
import { getVenueType } from "@/types/event";
import { EventImage } from "@/components/EventImage";

interface EventHeroProps {
  title: string;
  category?: string | null;
  date: string;
  time: string;
  venue?: string | null;
  location: string;
  image?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  isOnline?: boolean;
  onlineLink?: string | null;
  onSave?: () => void;
  onShare?: () => void;
}

export const EventHero = ({ title, category, date, time, venue, location, image, imageFocalX, imageFocalY, isOnline, onlineLink, onSave, onShare }: EventHeroProps) => {
  const venueType = getVenueType({ isOnline, venue, onlineLink });

  return (
    <div className="animate-in fade-in duration-700">
      <section className="rounded-2xl overflow-hidden">
        <div className="relative h-80 md:h-96 bg-muted rounded-t-2xl rounded-b-2xl">
          <EventImage
            src={image}
            alt={title}
            focalX={imageFocalX}
            focalY={imageFocalY}
            className="h-full w-full rounded-t-2xl rounded-b-2xl"
            fallback={
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm rounded-t-2xl rounded-b-2xl bg-muted">
                Event image coming soon
              </div>
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent rounded-t-2xl rounded-b-2xl" />

          {/* Save / Share buttons — top right of image */}
          {(onSave || onShare) && (
            <div className="absolute top-3 right-3 flex gap-2">
              {onSave && (
                <button
                  onClick={onSave}
                  className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                  aria-label="Save event"
                >
                  <Heart className="h-4 w-4" />
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                  aria-label="Share event"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
            {category && (
              <p className="text-xs uppercase tracking-wide text-white/80">{category}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">{title}</h1>
          </div>
        </div>
        <div className="p-6 md:p-7 grid gap-6 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">Date & time</p>
              <p className="text-sm font-medium text-foreground">{date}</p>
              {time && <p className="text-sm">{time}</p>}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-primary">
              {venueType === 'online' ? (
                <Globe className="h-4 w-4" />
              ) : venueType === 'hybrid' ? (
                <Video className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">
                {venueType === 'online' ? 'Online Event' : venueType === 'hybrid' ? 'Hybrid Event' : 'Location'}
              </p>
              <p className="text-sm font-medium text-foreground">
                {venueType === 'online'
                  ? 'Virtual — link available after registration'
                  : `${venue ? `${venue}, ` : ''}${location}`}
              </p>
              {venueType === 'hybrid' && (
                <p className="text-xs text-muted-foreground mt-0.5">Also available online</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
