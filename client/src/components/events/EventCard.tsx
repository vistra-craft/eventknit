import React, { useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { CalendarPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { getVenueType } from "@/types/event";
import { EventImage } from "./EventImage";
import { TiltCard } from "@/components/ui/TiltCard";
import { EASE } from "@/lib/animation-constants";

interface EventCardProps {
  id: string;
  slug?: string | null;
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
  isOnline?: boolean;
  onlineLink?: string | null;
  category?: string | null;
  isFeatured?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  id,
  slug,
  title,
  image,
  imageFocalX,
  imageFocalY,
  startDate,
  endDate,
  startTime,
  venue,
  location,
  price,
  currency,
  isOnline,
  onlineLink,
  isFeatured,
}) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-60px" });
  const venueType = getVenueType({ isOnline, venue, onlineLink });

  const handleCardClick = () => {
    navigate(`/event/${slug ?? id}`);
  };

  // Parse date parts for the stacked date block
  const startDateObj = new Date(startDate);
  const dayNum = startDateObj.getDate();
  const monthShort = startDateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const weekday = startDateObj.toLocaleDateString("en-US", { weekday: "short" });

  // End date range display
  const hasDateRange = endDate && new Date(endDate).toDateString() !== startDateObj.toDateString();
  const endDateObj = endDate ? new Date(endDate) : null;
  const endMonthDay = endDateObj ? `${endDateObj.toLocaleDateString("en-US", { month: "short" })} ${endDateObj.getDate()}` : "";

  const formatSingleTime = (timeStr?: string) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  };

  const timeStr = formatSingleTime(startTime);

  const isFree = price === "Free" || price === "0" || price === "0.00";
  const imgHeight = isFeatured ? "h-72 sm:h-80" : "h-48 sm:h-56";
  const titleSize = isFeatured ? "text-base sm:text-lg" : "text-sm sm:text-base";

  const priceDisplay = isFree
    ? "Free"
    : price === "See tickets"
      ? "See tickets"
      : `Starting ${currency || "KES"} ${price}`;

  // Add to calendar
  const handleAddToCalendar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    const d = new Date(startDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const [sH, sM] = (startTime || "00:00").split(":").map(Number);
    const dtStart = `${year}${month}${day}T${String(sH).padStart(2, "0")}${String(sM).padStart(2, "0")}00`;
    const eH = sH + 2;
    const dtEnd = `${year}${month}${day}T${String(eH).padStart(2, "0")}${String(sM).padStart(2, "0")}00`;
    const loc = [venue, location].filter(Boolean).join(", ");

    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EventKnit//EN",
      "BEGIN:VEVENT", `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
      `SUMMARY:${title}`, `LOCATION:${loc}`, "DESCRIPTION:View event at EventKnit",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [startDate, startTime, title, venue, location]);

  return (
    <div ref={cardRef}>
      <TiltCard className="group cursor-pointer rounded-2xl">
        <Card
          variant="interactive"
          onClick={handleCardClick}
          className="overflow-hidden bg-card rounded-2xl transition-all duration-300 border border-border/40 hover:border-border/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(249,115,22,0.12),0_4px_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_30px_-4px_rgba(249,115,22,0.15),0_4px_12px_-2px_rgba(0,0,0,0.4)]"
        >
          {/* Accent gradient strip */}
          <div className="h-[2px] bg-gradient-to-r from-primary via-orange-500/80 to-orange-500/20" />

          {/* Image */}
          <div className={`relative overflow-hidden ${imgHeight}`}>
            <EventImage
              src={image}
              alt={title}
              focalX={imageFocalX}
              focalY={imageFocalY}
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />

            {/* Free ribbon — diagonal corner strip */}
            {isFree && (
              <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden z-10">
                <div className="absolute top-[10px] -right-[22px] w-[100px] rotate-45 bg-emerald-500 text-white text-[10px] font-bold text-center py-0.5 shadow-sm">
                  FREE
                </div>
              </div>
            )}
          </div>

          {/* Details — date block + content */}
          <div className="flex gap-3 p-4">
            {/* Stacked date block */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
              className="relative shrink-0 w-12 text-center group/date"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-500 dark:text-orange-400">
                {weekday}
              </div>
              <div className="text-xl font-bold text-foreground">
                {dayNum}
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {monthShort}
              </div>
              {hasDateRange && (
                <div className="text-[8px] text-muted-foreground mt-0.5">
                  - {endMonthDay}
                </div>
              )}

              {/* Calendar icon — appears on hover */}
              <button
                onClick={handleAddToCalendar}
                className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 opacity-0 group-hover/date:opacity-100 transition-opacity"
                title="Add to calendar"
              >
                <CalendarPlus className="w-4 h-4 text-primary" />
              </button>
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <motion.h3
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, ease: EASE, delay: 0.15 }}
                className={`${titleSize} font-semibold text-foreground line-clamp-2`}
              >
                {title}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, ease: EASE, delay: 0.22 }}
                className="text-xs text-muted-foreground mt-1 truncate"
              >
                {venueType === "online" ? "Online Event" : (venue ? `${venue}, ${location}` : location)}
                {timeStr && <span> &middot; {timeStr}</span>}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, ease: EASE, delay: 0.29 }}
                className={`text-sm font-bold mt-1.5 ${isFree ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}
              >
                {priceDisplay}
              </motion.p>
            </div>
          </div>
        </Card>
      </TiltCard>
    </div>
  );
};
