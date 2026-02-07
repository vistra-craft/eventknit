import React from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Globe } from "lucide-react";
import { getVenueType } from "@/types/event";
import { EventImage } from "./EventImage";

interface EventCardProps {
  id: string;
  title: string;
  image: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  location: string;
  price: string;
  currency?: string;
  category: string;
  isOnline?: boolean;
  onlineLink?: string | null;
}

export const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  image,
  imageFocalX,
  imageFocalY,
  startDate,
  endDate,
  startTime,
  endTime,
  venue,
  location,
  category,
  isOnline,
  onlineLink,
}) => {
  const navigate = useNavigate();
  const venueType = getVenueType({ isOnline, venue, onlineLink });
  const handleCardClick = () => {
    navigate(`/event/${id}`);
  };

  // Format Date: Sat, Oct 04 - Sun, Aug 01
  const formatDate = (start: string, end?: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "2-digit",
    };
    const startDateObj = new Date(start);
    const startStr = startDateObj.toLocaleDateString("en-US", options);
    if (end) {
      const endDateObj = new Date(end);
      if (startDateObj.toDateString() !== endDateObj.toDateString()) {
        const endStr = endDateObj.toLocaleDateString("en-US", options);
        return `${startStr} - ${endStr}`;
      }
    }
    return startStr;
  };

  // Format Time: 10:00am - 04:00pm
  const formatTime = (start?: string, end?: string) => {
    if (!start) return "";
    const formatSingleTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).toLowerCase().replace(" ", "");
    };
    const startFormatted = formatSingleTime(start);
    if (end) {
      const endFormatted = formatSingleTime(end);
      return `${startFormatted} - ${endFormatted}`;
    }
    return startFormatted;
  };

  const dateDisplay = formatDate(startDate, endDate);
  const timeDisplay = formatTime(startTime, endTime);

  return (
    <Card
      variant="interactive"
      onClick={handleCardClick}
      className="group overflow-hidden bg-card-surface rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Event Image */}
      <div className="relative overflow-hidden h-64 rounded-lg">
        <EventImage
          src={image}
          alt={title}
          focalX={imageFocalX}
          focalY={imageFocalY}
          className="w-full h-full transition-transform duration-300"
        />
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-muted/80 text-foreground backdrop-blur-sm rounded-full text-xs">
            {category}
          </span>
        </div>
      </div>

      {/* Event Details */}
      <div className="pt-4 pb-2 pl-4 space-y-2">
        {/* Title */}
        <h3 className="text-lg font-medium text-foreground transition-colors duration-300 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{dateDisplay}</span>
        </div>

        {/* Time */}
        {timeDisplay && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{timeDisplay}</span>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {venueType === 'online' ? (
            <>
              <Globe className="w-4 h-4" />
              <span>Online Event</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              <span className="truncate">{venue ? `${venue}, ${location}` : location}</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};