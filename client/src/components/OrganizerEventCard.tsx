import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
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
    status?: string;
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
  const navigate = useNavigate();
  const [showStatusMessage, setShowStatusMessage] = useState(false);

  const status = (event.status ?? "").toUpperCase();
  const isApproved = status === "APPROVED";

  // Strip HTML tags from description for clean display
  const cleanDescription = (html: string): string => {
    return html.replace(/<[^>]*>/g, "").trim();
  };

  // Use real event data for metrics
  const metrics = {
    attendees: typeof event.attendees === "number" ? event.attendees : 0,
    capacity: typeof event.capacity === "number" ? event.capacity : 0,
    revenue: typeof event.revenue === "number" ? event.revenue : 0,
    views: typeof event.views === "number" ? event.views : 0,
    conversion:
      typeof event.conversion === "string"
        ? parseFloat(event.conversion)
        : typeof event.conversion === "number"
        ? event.conversion
        : 0,
    speakers: typeof event.speakers === "number" ? event.speakers : 0,
    exhibitors: typeof event.exhibitors === "number" ? event.exhibitors : 0,
    sponsors: typeof event.sponsors === "number" ? event.sponsors : 0,
  };

  const getCategoryColor = (category: string) => {
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

  const getStatusBadge = () => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "PENDING":
        return "Your event is pending admin approval. Management tools will be available once it's approved.";
      case "REJECTED":
        return "This event was not approved. Please review the feedback, make the required changes, and resubmit.";
      case "CANCELLED":
        return "This event has been cancelled and can no longer be managed.";
      default:
        return "This event is not yet available for management.";
    }
  };

  const handleManageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isApproved) {
      navigate(`/organizer/event/${event.id}`);
    } else {
      setShowStatusMessage((prev) => !prev);
    }
  };

  return (
    <Card className="group border border-border bg-card-surface rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
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
        {/* Title + status badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-xl font-medium text-foreground leading-tight">
            {event.title}
          </h3>
          {getStatusBadge()}
        </div>

        {/* Category badge */}
        {!["Tech Innovation Summit 2024", "Business Leadership Workshop", "Food & Wine Expo"].includes(event.title) && (
          <div className="mb-4">
            <Badge className={`${getCategoryColor(event.category)} border-0`}>
              <span className="capitalize">{event.category}</span>
            </Badge>
          </div>
        )}

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
            <span>{metrics.attendees}/{metrics.capacity || "∞"} attendees</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {cleanDescription(event.description)}
        </p>

        {/* Status message — shown on click for non-approved events */}
        {showStatusMessage && !isApproved && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{getStatusMessage()}</span>
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageClick}
          >
            Manage Event
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizerEventCard;
