import { Heart, Share2, MapPin, Calendar, Eye, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveFeaturedEvents, type ActiveFeaturedEvent } from "@/lib/featured-event-api";

export const Hero = () => {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState<ActiveFeaturedEvent[]>([]);

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
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredEvents.length]);

  // If there are no active featured events, show a clean placeholder hero
  if (featuredEvents.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="relative rounded-2xl overflow-hidden h-[450px] bg-gradient-to-br from-primary/30 via-accent-coral/20 to-accent-coral/20">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-accent-coral/30" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-2xl px-6">
              <Badge variant="secondary" className="bg-primary text-white">
                Discover Amazing Events
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
                Find Your Next Unforgettable Experience
              </h1>
              <p className="text-lg text-muted-foreground">
                Explore concerts, conferences, workshops, and more. Book tickets instantly.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-5 h-5" />
                  <span>Upcoming Events</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  <span>Multiple Locations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentEvent = featuredEvents[currentEventIndex];

  // Format date for display
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
    <div className="container mx-auto max-w-7xl px-6 py-8">
      {/* Hero Container with rounded corners */}
      <div className="relative rounded-2xl overflow-hidden h-[450px] lg:h-[500px]">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-muted transition-all duration-500"
          style={{
            backgroundImage: currentEvent.image ? `url(${currentEvent.image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Subtle gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        {/* Floating Card - Left Side */}
        <div className="absolute inset-y-0 left-0 flex items-center p-6 lg:p-10">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl p-6 lg:p-8 max-w-md w-full">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-4">
              {currentEvent.category && (
                <Badge className="bg-primary text-white">
                  {currentEvent.category}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />
                <span>{currentEvent.type === 'EVENT' ? 'Featured' : 'Spotlight'}</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-4">
              {currentEvent.title}
            </h1>

            {currentEvent.type === 'EVENT' ? (
              <>
                {/* Event Details */}
                <div className="space-y-3 mb-6">
                  {currentEvent.date && (
                    <div className="flex items-center gap-3 text-foreground">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{formatDate(currentEvent.date)}</div>
                        {currentEvent.time && (
                          <div className="text-sm text-muted-foreground">{currentEvent.time}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {(currentEvent.venue || currentEvent.location) && (
                    <div className="flex items-center gap-3 text-foreground">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        {currentEvent.venue && (
                          <div className="font-semibold">{currentEvent.venue}</div>
                        )}
                        {currentEvent.location && (
                          <div className="text-sm text-muted-foreground">{currentEvent.location}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentEvent.price && (
                    <div className="text-lg font-bold text-primary">
                      {currentEvent.price}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={handleViewEvent}
                    className="bg-primary hover:bg-primary/90 text-white flex-1"
                  >
                    Get Tickets
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`border-border ${isFavorited ? 'text-red-500 border-red-200' : 'text-muted-foreground'}`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-border text-muted-foreground"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Image Type Content */}
                {currentEvent.description && (
                  <p className="text-muted-foreground mb-6">
                    {currentEvent.description}
                  </p>
                )}
                {currentEvent.linkUrl && currentEvent.linkText && (
                  <Button
                    size="lg"
                    onClick={handleViewEvent}
                    className="bg-primary hover:bg-primary/90 text-white w-full"
                  >
                    {currentEvent.linkText}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        {featuredEvents.length > 1 && (
          <>
            {/* Prev/Next Buttons */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
              <Button
                variant="secondary"
                size="icon"
                onClick={goToPrevious}
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 text-foreground shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={goToNext}
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 text-foreground shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Event Indicators */}
            <div className="absolute bottom-6 right-6 z-20">
              <div className="flex gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg">
                {featuredEvents.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToEvent(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentEventIndex
                        ? 'bg-primary w-6'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};