import { Calendar, MapPin, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  rating?: number;
  category: string;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  id, 
  title, 
  image, 
  date, 
  time, 
  venue, 
  location, 
  organizer, 
  price, 
  rating = 0,
  category 
}) => {
  const navigate = useNavigate();
  const handleCardClick = () => {
    navigate(`/event/${id}`);
  };

  return (
    <Card 
      variant="interactive"
      onClick={handleCardClick}
      className="group overflow-hidden"
    >
      {/* Event Image */}
      <div className="relative overflow-hidden h-48">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-primary text-primary-foreground backdrop-blur-sm border border-primary rounded-full text-xs font-medium">
            {category}
          </span>
        </div>
        
        {/* Rating Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-primary text-primary-foreground backdrop-blur-sm border border-primary rounded-full px-2 py-1">
          <Star className="w-3 h-3 fill-primary-foreground text-primary-foreground" />
          <span className="text-xs font-medium">{rating}</span>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-foreground transition-colors duration-300 line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 transition-colors duration-300">
            <User className="w-3 h-3" />
            by {organizer}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground/70 transition-colors duration-300">
            <Calendar className="w-4 h-4 text-accent-electric" />
            <span>{date} • {time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/70 transition-colors duration-300">
            <MapPin className="w-4 h-4 text-accent-neon" />
            <span className="truncate">{venue}, {location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-card-border transition-colors duration-300">
          <div>
            <div className="text-sm text-muted-foreground transition-colors duration-300">From</div>
            <div className="text-xl font-bold text-primary transition-colors duration-300">{price}</div>
          </div>
          <Button 
            variant="event" 
            size="sm" 
            className="group-hover:bg-primary-foreground group-hover:text-primary transition-all duration-200"
            onClick={() => navigate(`/event/${id}`)}
          >
            Get Tickets
          </Button>
        </div>
      </div>
    </Card>
  );
};