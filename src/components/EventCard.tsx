import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface EventCardProps {
  event: {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    venue: string;
    status: string;
    attendees: number;
    capacity: number;
    revenue: number;
    views: number;
    conversion: number;
    speakers: number;
    exhibitors: number;
    sponsors: number;
    image: string;
    description: string;
    category: string;
  };
}

const EventCard = ({ event }: EventCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent-neon/10 text-accent-neon border-accent-neon/20";
      case "upcoming":
        return "bg-accent-electric/10 text-accent-electric border-accent-electric/20";
      case "completed":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "upcoming":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden">
        <img 
          src={event.image}
          alt={event.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <Badge className={`${getStatusColor(event.status)} border-0`}>
            <div className="flex items-center gap-1">
              {getStatusIcon(event.status)}
              <span className="capitalize">{event.status}</span>
            </div>
          </Badge>
        </div>
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-800">
            {event.category}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        
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
            <span>{event.attendees}/{event.capacity} attendees</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {event.description}
        </p>
        
        {/* Event Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Speakers</p>
            <p className="font-semibold text-foreground">{event.speakers}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Exhibitors</p>
            <p className="font-semibold text-foreground">{event.exhibitors}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="font-semibold text-foreground">${event.revenue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {event.conversion}% conversion
          </span>
          <Button 
            variant="outline" 
            size="sm"
            className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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

export default EventCard;