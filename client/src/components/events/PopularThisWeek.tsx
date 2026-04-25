import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, CalendarPlus, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EventImage } from "./EventImage";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { EASE } from "@/lib/animation-constants";
import { useEvents } from "@/hooks/useEvents";
import { EventStatus, EventType } from "@/lib/event-api";
import type { EventData } from "@/types/event";

function PopularCard({ event, index }: { event: EventData; index: number }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const dateObj = new Date(event.startDate);
  const dayNum = dateObj.getDate();
  const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
  };

  const isFree = event.isFree || event.priceDisplay === 0;
  const hasNumericPrice = typeof event.priceDisplay === "number" && event.priceDisplay > 0;
  const priceStr = isFree
    ? "Free"
    : hasNumericPrice
      ? `${event.currency || "KES"} ${event.priceDisplay}`
      : "See tickets";

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const y = dateObj.getFullYear();
    const mo = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const [sH, sM] = (event.startTime || "00:00").split(":").map(Number);
    const dtStart = `${y}${mo}${d}T${String(sH).padStart(2, "0")}${String(sM).padStart(2, "0")}00`;
    const dtEnd = `${y}${mo}${d}T${String(sH + 2).padStart(2, "0")}${String(sM).padStart(2, "0")}00`;
    const loc = [event.venue, event.location].filter(Boolean).join(", ");
    const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//EventKnit//EN","BEGIN:VEVENT",`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,`SUMMARY:${event.title}`,`LOCATION:${loc}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: EASE, delay: index * 0.06 }}
      onClick={() => navigate(`/event/${event.slug ?? event.id}`)}
      className="group shrink-0 cursor-pointer snap-start w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-3rem)/4)]"
    >
      <div className="rounded-2xl overflow-hidden border border-border/40 hover:border-border/60 bg-card transition-all duration-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-4px_rgba(249,115,22,0.12),0_4px_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_30px_-4px_rgba(249,115,22,0.15),0_4px_12px_-2px_rgba(0,0,0,0.4)]">
        {/* Accent strip */}
        <div className="h-[2px] bg-gradient-to-r from-primary via-orange-500/80 to-orange-500/20" />

        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <EventImage
            src={event.image || ""}
            alt={event.title}
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Registration count badge */}
          {typeof event.registrationCount === "number" && event.registrationCount > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
              <TrendingUp className="w-3 h-3" />
              {event.registrationCount.toLocaleString()} going
            </div>
          )}

          {/* Free ribbon */}
          {isFree && (
            <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-10">
              <div className="absolute top-[8px] -right-[18px] w-[80px] rotate-45 bg-emerald-500 text-white text-[9px] font-bold text-center py-0.5 shadow-sm">
                FREE
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex gap-3 p-3">
          {/* Date block */}
          <div className="relative shrink-0 w-10 text-center group/date">
            <div className="text-lg font-bold text-foreground">{dayNum}</div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">{monthShort}</div>

            <button
              onClick={handleAddToCalendar}
              className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 opacity-0 group-hover/date:opacity-100 transition-opacity"
              title="Add to calendar"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-primary" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground line-clamp-1">{event.title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {event.venue ? `${event.venue}, ${event.location}` : event.location}
              {event.startTime && <span> &middot; {formatTime(event.startTime)}</span>}
            </p>
            <p className={`text-xs font-bold mt-1 ${isFree ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
              {priceStr}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PopularCardSkeleton() {
  return (
    <div className="shrink-0 w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-3rem)/4)]">
      <div className="rounded-2xl overflow-hidden border border-border/40 bg-card">
        <div className="h-[2px] bg-gradient-to-r from-muted-foreground/10 via-muted-foreground/5 to-transparent" />
        <div className="relative h-48 bg-muted animate-pulse" />
        <div className="flex gap-3 p-3">
          <div className="shrink-0 w-10 space-y-1">
            <div className="h-5 rounded bg-muted-foreground/10 animate-pulse" />
            <div className="h-3 rounded bg-muted-foreground/8 animate-pulse" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 rounded bg-muted-foreground/10 animate-pulse w-4/5" />
            <div className="h-3 rounded bg-muted-foreground/8 animate-pulse w-3/5" />
            <div className="h-3 rounded bg-blue-500/10 animate-pulse w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PopularThisWeekProps {
  onSeeAll?: () => void;
}

export function PopularThisWeek({ onSeeAll }: PopularThisWeekProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { events: fetchedEvents, isLoading, fetchEvents } = useEvents();

  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    fetchEvents({
      status: EventStatus.APPROVED,
      type: EventType.PUBLIC,
      dateFrom: today.toISOString(),
      dateTo: endOfWeek.toISOString(),
      limit: 12,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sort by registration count descending to surface most popular first
  const events = [...(fetchedEvents ?? [])].sort(
    (a, b) => (b.registrationCount ?? 0) - (a.registrationCount ?? 0)
  );

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollBy = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = (el.firstElementChild as HTMLElement)?.offsetWidth ?? 280;
    el.scrollBy({ left: dir === "left" ? -(cardWidth + 16) : cardWidth + 16, behavior: "smooth" });
  }, []);

  if (!isLoading && events.length === 0) return null;

  return (
    <section className="py-6 bg-background group/popular">
      <div className="container mx-auto px-6">
        <AnimatedSection className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Popular this week</h2>
            </div>
            <button
              onClick={onSeeAll ?? (() => navigate("/events"))}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </AnimatedSection>

        {/* Carousel with arrow navigation */}
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => scrollBy("left")}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover/popular:opacity-100 hover:bg-muted ${canScrollLeft ? "pointer-events-auto" : "pointer-events-none opacity-0!"}`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>

          {/* Right arrow */}
          <button
            onClick={() => scrollBy("right")}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover/popular:opacity-100 hover:bg-muted ${canScrollRight ? "pointer-events-auto" : "pointer-events-none opacity-0!"}`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>

          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <PopularCardSkeleton key={i} />)
              : events.map((event, i) => (
                  <PopularCard key={event.id} event={event} index={i} />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
