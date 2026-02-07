import {
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EventImage } from "./EventImage";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    image: string;
    imageFocalX?: number | null;
    imageFocalY?: number | null;
    date: string;
    time: string;
    venue: string;
    location: string;
    organizer: string;
    price: string;
    category: string;
    description: string;
    fullDescription: string;
    duration: string;
    ageRestriction: string;
    attendees?: number;
    capacity?: number;
    revenue?: number;
    views?: number;
    conversion?: string | number;
    speakers?: number;
    exhibitors?: number;
    sponsors?: number;
  };
}

const OrganizerEventCard = ({ event }: EventCardProps) => {

  // Use real event data for metrics
  const metrics = {
    attendees: typeof event.attendees === 'number' ? event.attendees : 0,
    capacity: typeof event.capacity === 'number' ? event.capacity : 0,
    revenue: typeof event.revenue === 'number' ? event.revenue : 0,
    views: typeof event.views === 'number' ? event.views : 0,
    conversion: typeof event.conversion === 'string' ? parseFloat(event.conversion) : (typeof event.conversion === 'number' ? event.conversion : 0),
    speakers: typeof event.speakers === 'number' ? event.speakers : 0,
    exhibitors: typeof event.exhibitors === 'number' ? event.exhibitors : 0,
    sponsors: typeof event.sponsors === 'number' ? event.sponsors : 0,
  };

  const getStatusColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "music":
        return "bg-primary/10 text-primary border-primary/20";
      case "comedy":
        return "bg-primary/10 text-primary border-primary/20";
      case "sports":
        return "bg-success/10 text-success border-success/20";
      case "arts":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "music":
        return <CheckCircle className="h-4 w-4" />;
      case "comedy":
        return <Clock className="h-4 w-4" />;
      case "sports":
        return <CheckCircle className="h-4 w-4" />;
      case "arts":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="group cursor-pointer border border-border bg-card-surface rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Event Image */}
      <div className="relative w-full h-48 overflow-hidden bg-muted">
        <EventImage
          src={event.image}
          alt={event.title}
          focalX={event.imageFocalX}
          focalY={event.imageFocalY}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          fallback={
            <div className="w-full h-48 bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No image</p>
              </div>
            </div>
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium text-foreground">
            {event.title}
          </h3>
          {/* Hide category badge for specific events */}
          {!["Tech Innovation Summit 2024", "Business Leadership Workshop", "Food & Wine Expo"].includes(event.title) && (
            <Badge className={`${getStatusColor(event.category)} border-0`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(event.category)}
                <span className="capitalize">{event.category}</span>
              </div>
            </Badge>
          )}
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{metrics.attendees}/{metrics.capacity || '∞'} attendees</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {event.description}
        </p>
        
        <div className="flex items-center justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/organizer/event/${event.id}`;
            }}
          >
            Manage Event
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizerEventCard;
