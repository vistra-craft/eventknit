import React from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";

interface EventCardProps {
  id: string;
  title: string;
  image: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  location: string;
  price: string;
  currency?: string;
  category: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  image,
  startDate,
  endDate,
  startTime,
  endTime,
  venue,
  location,
  price,
  currency,
  category,
}) => {
  const navigate = useNavigate();
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
      className="group overflow-hidden border border-border bg-background rounded-2xl transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
    >
      {/* Event Image */}
      <div className="relative overflow-hidden h-64 rounded-lg">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover object-top transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
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
        <h3 className="text-lg font-bold text-foreground transition-colors duration-300 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm font-medium text-primary transition-colors">
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
          <MapPin className="w-4 h-4" />
          <span className="truncate">{venue ? `${venue}, ${location}` : location}</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{price === 'Free' || price === '0' || !price
            ? 'Free'
            : price === 'See tickets'
              ? 'See tickets'
              : currency
                ? `From ${currency}${price}`
                : `From ${price}`}</span>
        </div>
      </div>
    </Card>
  );
};