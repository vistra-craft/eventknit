import { Calendar, MapPin, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EventCardProps {
  id: string;
  title: string;
  image: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  organizer: string;
  price: string;
  rating: number;
  category: string;
}

export const EventCard = ({ 
  id, 
  title, 
  image, 
  date, 
  time, 
  venue, 
  location, 
  organizer, 
  price, 
  rating,
  category 
}: EventCardProps) => {
  const navigate = useNavigate();
  return (
    <div className="group bg-gradient-card border border-card-border rounded-xl overflow-hidden shadow-card hover:bg-gradient-card-hover hover:shadow-card-hover transition-all duration-500 hover:-translate-y-3 hover:border-primary hover:scale-[1.02]">
      {/* Event Image */}
      <div className="relative overflow-hidden h-48">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-glass-bg backdrop-blur-sm border border-glass-border rounded-full text-xs font-medium text-primary-glow">
            {category}
          </span>
        </div>
        
        {/* Rating Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-glass-bg backdrop-blur-sm border border-glass-border rounded-full px-2 py-1">
          <Star className="w-3 h-3 fill-accent-coral text-accent-coral" />
          <span className="text-xs font-medium text-foreground">{rating}</span>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground group-hover:text-white transition-colors duration-300 line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground group-hover:text-white/80 flex items-center gap-1 mt-1 transition-colors duration-300">
            <User className="w-3 h-3" />
            by {organizer}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground/70 group-hover:text-white/90 transition-colors duration-300">
            <Calendar className="w-4 h-4 text-accent-electric group-hover:text-white" />
            <span>{date} • {time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/70 group-hover:text-white/90 transition-colors duration-300">
            <MapPin className="w-4 h-4 text-accent-neon group-hover:text-white" />
            <span className="truncate">{venue}, {location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-card-border group-hover:border-white/30 transition-colors duration-300">
          <div>
            <div className="text-sm text-muted-foreground group-hover:text-white/70 transition-colors duration-300">From</div>
            <div className="text-xl font-bold text-primary group-hover:text-white transition-colors duration-300">{price}</div>
          </div>
          <Button 
            variant="event" 
            size="sm" 
            className="group-hover:bg-white group-hover:text-primary group-hover:shadow-glow transition-all duration-300"
            onClick={() => navigate(`/event/${id}`)}
          >
            Get Tickets
          </Button>
        </div>
      </div>
    </div>
  );
};