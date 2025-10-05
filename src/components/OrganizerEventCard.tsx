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
    id: string;
    title: string;
    image: string;
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
  };
}

const OrganizerEventCard = ({ event }: EventCardProps) => {
  // Generate mock data for organizer dashboard metrics
  const mockMetrics = {
    attendees: Math.floor(Math.random() * 500) + 50,
    capacity: Math.floor(Math.random() * 200) + 300,
    revenue: Math.floor(Math.random() * 50000) + 10000,
    views: Math.floor(Math.random() * 1000) + 200,
    conversion: Math.floor(Math.random() * 20) + 5,
    speakers: Math.floor(Math.random() * 10) + 1,
    exhibitors: Math.floor(Math.random() * 15) + 2,
    sponsors: Math.floor(Math.random() * 8) + 1,
  };

  const getStatusColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "music":
        return "bg-accent-neon/10 text-accent-neon border-accent-neon/20";
      case "comedy":
        return "bg-accent-electric/10 text-accent-electric border-accent-electric/20";
      case "sports":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "arts":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
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
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <Badge className={`${getStatusColor(event.category)} border-0`}>
            <div className="flex items-center gap-1">
              {getStatusIcon(event.category)}
              <span className="capitalize">{event.category}</span>
            </div>
          </Badge>
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
            <span>{mockMetrics.attendees}/{mockMetrics.capacity} attendees</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {event.description}
        </p>
        
        {/* Event Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Speakers</p>
            <p className="font-semibold text-foreground">{mockMetrics.speakers}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Exhibitors</p>
            <p className="font-semibold text-foreground">{mockMetrics.exhibitors}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="font-semibold text-foreground">${mockMetrics.revenue.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {mockMetrics.conversion}% conversion
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

export default OrganizerEventCard;
