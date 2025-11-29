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
    <div className="container mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-700">
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden rounded-2xl shadow-xl">
        {/* Hero Image */}
        <div className="absolute inset-0">
          {image ? (
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-6 md:p-10 text-white">
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
            {/* Category Badge */}
            {category && (
              <div className="mb-4">
                <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-3 py-1 border-0">
                  {category}
                </Badge>
              </div>
            )}

            {/* Event Title */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight shadow-sm drop-shadow-md">
              {title}
            </h1>

            {/* Event Details */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-base md:text-lg font-medium text-white/90">
              <div className="flex items-center gap-2 drop-shadow-md">
                <Calendar className="w-5 h-5" />
                <span>{date} • {time}</span>
              </div>
              <div className="flex items-center gap-2 drop-shadow-md">
                <MapPin className="w-5 h-5" />
                <span>{venue ? `${venue}, ` : ''}{location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
