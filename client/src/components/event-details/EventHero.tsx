import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventHeroProps {
  title: string;
  category?: string | null;
  date: string;
  time: string;
  venue?: string | null;
  location: string;
  image?: string | null;
}

export const EventHero = ({ title, category, date, time, venue, location, image }: EventHeroProps) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-4 animate-in fade-in duration-700">
      <section className="rounded-2xl bg-white shadow-sm border-0 overflow-hidden">
        <div className="relative h-52 md:h-56 bg-muted">
          {image ? (
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
              Event image coming soon
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
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
              <p className="font-medium text-foreground">{date}</p>
              {time && <p>{time}</p>}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">Location</p>
              <p className="font-medium text-foreground">
                {venue ? `${venue}, ` : ""}
                {location}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
