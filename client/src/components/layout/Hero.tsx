import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, type PanInfo } from "framer-motion";
import { MapPin, Calendar, Eye, ChevronLeft, ChevronRight, ChevronDown, ArrowRight, Sparkles, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getActiveFeaturedEvents, type ActiveFeaturedEvent } from "@/lib/featured-event-api";
import * as eventApi from "@/lib/event-api";
import { EventStatus, EventType } from "@/lib/event-api";
import { getFocalPointStyle } from "@/lib/image-utils";
import { HeroSkeleton } from "./HeroSkeleton";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { EASE } from "@/lib/animation-constants";

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD = 50;
const FALLBACK_LIMIT = 5;

/**
 * Map a regular event into the ActiveFeaturedEvent shape
 * so the carousel can render both featured and auto-featured events identically.
 */
function eventToFeatured(event: {
  id: string;
  slug?: string | null;
  title: string;
  image?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  category?: string | null;
  startDate: string;
  startTime?: string | null;
  venue?: string | null;
  location: string;
  isFree?: boolean;
  price?: number | null;
  currency?: string | null;
}): ActiveFeaturedEvent {
  const priceStr = event.isFree ? "Free" : event.price ? `${event.currency || "KES"} ${event.price}` : "";

  return {
    id: `auto-${event.id}`,
    type: "EVENT" as const,
    eventId: event.id,
    slug: event.slug,
    title: event.title,
    image: event.image || "",
    imageFocalX: event.imageFocalX,
    imageFocalY: event.imageFocalY,
    category: event.category || "",
    date: event.startDate,
    time: event.startTime || "",
    venue: event.venue || "",
    location: event.location,
    price: priceStr,
    displayOrder: 0,
    event: { id: event.id, title: event.title, image: event.image, category: event.category, startDate: event.startDate, startTime: event.startTime, venue: event.venue, location: event.location, price: event.price, isFree: event.isFree ?? false },
  };
}

export const Hero = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [heroEvents, setHeroEvents] = useState<ActiveFeaturedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [direction, setDirection] = useState(1);
  const [heroMode, setHeroMode] = useState<"featured" | "auto" | "brand">("featured");

  // Parallax: content fades and lifts as you scroll away
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // 3-tier fetch: featured → upcoming → brand fallback
  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        // Tier 1: try featured events
        const featured = await getActiveFeaturedEvents();
        if (featured.length > 0) {
          setHeroEvents(featured);
          setHeroMode("featured");
          preloadImage(featured[0]?.image);
          return;
        }

        // Tier 2: auto-feature upcoming events
        const response = await eventApi.getEvents({
          status: EventStatus.APPROVED,
          type: EventType.PUBLIC,
          limit: FALLBACK_LIMIT,
          page: 1,
        });

        if (response.success && response.data?.events?.length > 0) {
          const upcoming = response.data.events
            .filter((e) => new Date(e.startDate) > new Date()) // only future events
            .filter((e) => e.image) // only events with images
            .slice(0, FALLBACK_LIMIT)
            .map(eventToFeatured);

          if (upcoming.length > 0) {
            setHeroEvents(upcoming);
            setHeroMode("auto");
            preloadImage(upcoming[0]?.image);
            return;
          }
        }

        // Tier 3: static brand hero
        setHeroMode("brand");
        setImageReady(true);
      } catch (error) {
        console.error("Failed to fetch hero data:", error);
        setHeroMode("brand");
        setImageReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    const preloadImage = (src?: string) => {
      if (!src) { setImageReady(true); return; }
      const img = new Image();
      img.onload = () => setImageReady(true);
      img.onerror = () => setImageReady(true);
      img.src = src;
    };

    fetchHeroData();
  }, []);

  // Auto-rotation
  useEffect(() => {
    if (!isAutoPlaying || heroEvents.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentEventIndex((prev) => (prev === heroEvents.length - 1 ? 0 : prev + 1));
    }, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [isAutoPlaying, heroEvents.length]);

  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false);
    setDirection(-1);
    setCurrentEventIndex((prev) => (prev === 0 ? heroEvents.length - 1 : prev - 1));
  }, [heroEvents.length]);

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false);
    setDirection(1);
    setCurrentEventIndex((prev) => (prev === heroEvents.length - 1 ? 0 : prev + 1));
  }, [heroEvents.length]);

  const goToEvent = useCallback((index: number) => {
    setIsAutoPlaying(false);
    setDirection(index > currentEventIndex ? 1 : -1);
    setCurrentEventIndex(index);
  }, [currentEventIndex]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goToNext();
    else if (info.offset.x > SWIPE_THRESHOLD) goToPrevious();
  }, [goToNext, goToPrevious]);

  if (isLoading || (!imageReady && heroEvents.length > 0)) {
    return <HeroSkeleton />;
  }

  // Tier 3: static brand hero when no events exist at all
  if (heroMode === "brand") {
    return <BrandHero />;
  }

  const currentEvent = heroEvents[currentEventIndex];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const handleViewEvent = () => {
    if (currentEvent.type === "EVENT" && currentEvent.eventId) {
      navigate(`/event/${currentEvent.slug ?? currentEvent.eventId}`);
    } else if (currentEvent.type === "IMAGE" && currentEvent.linkUrl) {
      if (currentEvent.linkUrl.startsWith("http")) {
        window.open(currentEvent.linkUrl, "_blank");
      } else {
        navigate(currentEvent.linkUrl);
      }
    }
  };

  const scrollToSearch = () => {
    document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddToCalendar = () => {
    if (currentEvent.type !== "EVENT" || !currentEvent.date) return;

    const eventDate = new Date(currentEvent.date);
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, "0");
    const day = String(eventDate.getDate()).padStart(2, "0");

    // Parse time (e.g. "09:00") or default to midnight
    const [startH, startM] = (currentEvent.time || "00:00").split(":").map(Number);
    const dtStart = `${year}${month}${day}T${String(startH).padStart(2, "0")}${String(startM).padStart(2, "0")}00`;
    // Default 2 hour duration
    const endH = startH + 2;
    const dtEnd = `${year}${month}${day}T${String(endH).padStart(2, "0")}${String(startM).padStart(2, "0")}00`;

    const venue = [currentEvent.venue, currentEvent.location].filter(Boolean).join(", ");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//EventKnit//EN",
      "BEGIN:VEVENT",
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${currentEvent.title}`,
      `LOCATION:${venue}`,
      `DESCRIPTION:View event at EventKnit`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentEvent.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, scale: 1.05, x: d > 0 ? 60 : -60, filter: "blur(4px)" }),
    center: { opacity: 1, scale: 1, x: 0, filter: "blur(0px)" },
    exit: (d: number) => ({ opacity: 0, scale: 0.97, x: d > 0 ? -40 : 40, filter: "blur(2px)" }),
  };

  return (
    <section
      ref={heroRef}
      className="relative h-[480px] sm:h-[500px] lg:h-[560px]"
      style={{ clipPath: "inset(0)" }}
    >
      {/* Background image — fixed to viewport top, same height as hero, clipped by parent */}
      <div className="fixed top-0 left-0 right-0 h-[480px] sm:h-[500px] lg:h-[560px] z-0">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentEventIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.8, ease: EASE }}
            className="absolute inset-0 bg-muted"
            style={{
              backgroundImage: currentEvent.image ? `url(${currentEvent.image})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: getFocalPointStyle(currentEvent.imageFocalX, currentEvent.imageFocalY),
            }}
          />
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent z-[1]" />

        {/* Ambient glows */}
        <AmbientGlow className="w-[400px] h-[400px] bg-primary/15 -top-32 -left-24 z-[2]" duration={30} />
        <AmbientGlow className="w-[300px] h-[300px] bg-orange-500/10 -bottom-20 -right-16 z-[2]" duration={35} delay={5} />
      </div>

      {/* Interactive swipe layer */}
      <motion.div
        className="absolute inset-0 z-[5]"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        style={{ cursor: "grab", touchAction: "pan-y" }}
      />

      {/* Nav arrows */}
      {heroEvents.length > 1 && (
        <>
          <Button variant="ghost" size="icon" onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/30 text-white border-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/30 text-white border-0">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Content — lifts and fades on scroll */}
      <motion.div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 z-10" style={{ opacity: contentOpacity, y: contentY }}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex-1 max-w-2xl space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2">
              {currentEvent.category && (
                <Badge className="bg-primary text-white text-xs">{currentEvent.category}</Badge>
              )}
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Eye className="w-3.5 h-3.5" />
                <span>{heroMode === "featured" ? "Featured" : "Upcoming"}</span>
              </div>
            </div>

            {/* Word-by-word headline */}
            <AnimatePresence mode="wait">
              <motion.h1 key={`title-${currentEventIndex}`} className="text-2xl lg:text-4xl font-bold text-white flex flex-wrap gap-x-[0.3em]">
                {currentEvent.title.split(" ").map((word, i) => (
                  <motion.span
                    key={`${currentEventIndex}-${i}`}
                    initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.06 }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.h1>
            </AnimatePresence>

            {currentEvent.type === "EVENT" ? (
              <motion.div
                key={`details-${currentEventIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.4 }}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/85"
              >
                {currentEvent.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {formatDate(currentEvent.date)}
                      {currentEvent.time && <span className="text-white/60"> &middot; {currentEvent.time}</span>}
                    </span>
                  </div>
                )}
                {(currentEvent.venue || currentEvent.location) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {currentEvent.venue}{currentEvent.venue && currentEvent.location && ", "}{currentEvent.location}
                    </span>
                  </div>
                )}
                {currentEvent.price && (
                  <span className="text-sm font-semibold text-orange-400">{currentEvent.price}</span>
                )}
              </motion.div>
            ) : (
              currentEvent.description && (
                <motion.p key={`desc-${currentEventIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.3 }} className="text-white/75 text-sm lg:text-base max-w-xl">
                  {currentEvent.description}
                </motion.p>
              )
            )}
          </div>

          {/* CTA */}
          <motion.div key={`cta-${currentEventIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.5 }} className="flex items-center gap-2.5">
            <Button variant="outline" size="default" onClick={handleViewEvent} className="border-white/20 text-white bg-black/50 backdrop-blur-sm hover:bg-black/70 hover:border-white/40 shadow-md">
              {currentEvent.type === "EVENT" ? "Get Tickets" : (currentEvent.linkText || "Learn More")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {currentEvent.type === "EVENT" && currentEvent.date && (
              <Button variant="outline" size="default" onClick={handleAddToCalendar} className="border-white/15 text-white/90 bg-black/40 backdrop-blur-sm hover:bg-black/60 hover:border-white/30 shadow-md">
                <CalendarPlus className="w-4 h-4 mr-1.5" />
                Calendar
              </Button>
            )}
          </motion.div>
        </div>

        {/* Dots + scroll hint */}
        <div className="flex items-center justify-between mt-6">
          {heroEvents.length > 1 ? (
            <div className="flex gap-2">
              {heroEvents.map((_, index) => (
                <button key={index} onClick={() => goToEvent(index)} className={`h-1.5 rounded-full transition-all duration-300 ${index === currentEventIndex ? "bg-primary w-8" : "bg-white/40 w-1.5 hover:bg-white/60"}`} />
              ))}
            </div>
          ) : <div />}
          <motion.button onClick={scrollToSearch} animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="text-white/50 hover:text-white/80 transition-colors" aria-label="Scroll to events">
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
};

/** Static brand hero — shown when no events exist at all */
function BrandHero() {
  const navigate = useNavigate();

  return (
    <section className="relative">
      <div className="relative overflow-hidden h-[480px] sm:h-[500px] lg:h-[560px] bg-gradient-to-br from-primary/10 via-background to-orange-500/5 flex items-center">
        <AmbientGlow className="w-[500px] h-[500px] bg-primary/10 -top-40 -left-32 z-0" duration={30} />
        <AmbientGlow className="w-[400px] h-[400px] bg-orange-500/8 -bottom-32 -right-24 z-0" duration={35} delay={5} />

        <div className="relative z-10 px-8 lg:px-16 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">EventKnit</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }} className="text-3xl lg:text-5xl font-bold text-foreground tracking-tight">
            Find your next{" "}
            <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">experience</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.2 }} className="mt-4 text-muted-foreground max-w-lg">
            Discover events happening around you. From conferences to concerts, workshops to wellness retreats.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.3 }} className="mt-6 flex gap-3">
            <Button size="lg" onClick={() => document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" })}>
              Browse Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth/register/organizer")}>
              Create Event
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
