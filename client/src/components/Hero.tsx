import { MapPin, Calendar, Eye, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveFeaturedEvents, type ActiveFeaturedEvent } from "@/lib/featured-event-api";
import { getFocalPointStyle } from "@/lib/image-utils";
import { HeroSkeleton } from "./HeroSkeleton";
import { EmptyFeaturedState } from "./EmptyFeaturedState";

export const Hero = () => {
  const navigate = useNavigate();
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState<ActiveFeaturedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch featured events on mount
  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const events = await getActiveFeaturedEvents();
        setFeaturedEvents(events);
        if (events.length > 0) {
          setCurrentEventIndex(0);
        }
      } catch (error) {
        console.error("Failed to fetch featured events:", error);
        setFeaturedEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  // Auto-rotation logic
  useEffect(() => {
    if (!isAutoPlaying || featuredEvents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentEventIndex((prevIndex) =>
        prevIndex === featuredEvents.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredEvents.length]);

  // Show loading skeleton while loading
  if (isLoading) {
    return <HeroSkeleton />;
  }

  // Show empty state when no events exist
  if (featuredEvents.length === 0) {
    return <EmptyFeaturedState />;
  }

  const currentEvent = featuredEvents[currentEventIndex];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentEventIndex((prevIndex) =>
      prevIndex === 0 ? featuredEvents.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentEventIndex((prevIndex) =>
      prevIndex === featuredEvents.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToEvent = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentEventIndex(index);
  };

  const handleViewEvent = () => {
    if (currentEvent.type === 'EVENT' && currentEvent.eventId) {
      navigate(`/event/${currentEvent.eventId}`);
    } else if (currentEvent.type === 'IMAGE' && currentEvent.linkUrl) {
      if (currentEvent.linkUrl.startsWith('http://') || currentEvent.linkUrl.startsWith('https://')) {
        window.open(currentEvent.linkUrl, '_blank');
      } else {
        navigate(currentEvent.linkUrl);
      }
    }
  };

  return (
    <div className="container mx-auto px-6 py-6">
      {/* Hero Container */}
      <div className="relative rounded-2xl overflow-hidden h-[400px] lg:h-[450px]">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-muted transition-all duration-700"
          style={{
            backgroundImage: currentEvent.image ? `url(${currentEvent.image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: getFocalPointStyle(currentEvent.imageFocalX, currentEvent.imageFocalY)
          }}
        />

        {/* Gradient overlay - stronger for readability on any image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Navigation Arrows - Left */}
        {featuredEvents.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white border-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}

        {/* Navigation Arrows - Right */}
        {featuredEvents.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white border-0"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}

        {/* Content - Bottom aligned */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {/* Left side - Event info */}
            <div className="flex-1 max-w-2xl space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2">
                {currentEvent.category && (
                  <Badge className="bg-primary text-white text-xs">
                    {currentEvent.category}
                  </Badge>
                )}
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{currentEvent.type === 'EVENT' ? 'Featured' : 'Spotlight'}</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
                {currentEvent.title}
              </h1>

              {currentEvent.type === 'EVENT' ? (
                /* Event details row */
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/90">
                  {currentEvent.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{formatDate(currentEvent.date)}</span>
                      {currentEvent.time && (
                        <span className="text-sm text-white/70">• {currentEvent.time}</span>
                      )}
                    </div>
                  )}
                  {(currentEvent.venue || currentEvent.location) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {currentEvent.venue}{currentEvent.venue && currentEvent.location && ', '}{currentEvent.location}
                      </span>
                    </div>
                  )}
                  {currentEvent.price && (
                    <span className="text-sm font-semibold text-primary">
                      {currentEvent.price}
                    </span>
                  )}
                </div>
              ) : (
                currentEvent.description && (
                  <p className="text-white/80 text-sm lg:text-base max-w-xl">
                    {currentEvent.description}
                  </p>
                )
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="default"
                onClick={handleViewEvent}
                className="border-white/30 text-white/90 bg-white/10 hover:bg-white/20 hover:border-white/50 shadow-none"
              >
                {currentEvent.type === 'EVENT' ? 'Get Tickets' : (currentEvent.linkText || 'Learn More')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Dot indicators */}
          {featuredEvents.length > 1 && (
            <div className="flex justify-center lg:justify-start gap-2 mt-6">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToEvent(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentEventIndex
                      ? 'bg-primary w-8'
                      : 'bg-white/40 w-1.5 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};