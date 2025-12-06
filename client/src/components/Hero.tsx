import { Heart, Share2, MapPin, Calendar, Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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

  // If there are no active featured events, show a clean placeholder hero (no spinner)
  if (featuredEvents.length === 0) {
    return (
      <div className="relative">
      <div 
        className="w-full h-[60vh] object-cover transition-opacity duration-500 relative bg-gradient-to-br from-primary/30 via-accent-coral/20 to-accent-coral/20 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-accent-coral/30 z-10" />
          
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="container mx-auto max-w-7xl px-6 text-center">
              <div className="space-y-6 max-w-3xl mx-auto">
                <Badge variant="secondary" className="bg-accent-coral text-white shadow-lg shadow-primary/50 mb-4">
                  🎉 Discover Amazing Events
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
                  Find Your Next Unforgettable Experiences
                </h1>
                <p className="text-xl text-muted-foreground">
                  Explore concerts, conferences, workshops, and more. Book tickets instantly and join thousands of attendees at premier events.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-5 h-5" />
                    <span>Upcoming Events</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    <span>Multiple Locations</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-5 h-5" />
                    <span>Featured Events</span>
                  </div>
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
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
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

  const handleImageClick = () => {
    if (currentEvent.type === 'EVENT' && currentEvent.eventId) {
      navigate(`/event/${currentEvent.eventId}`);
    } else if (currentEvent.type === 'IMAGE' && currentEvent.linkUrl) {
      // Open link in new tab if it's an external URL, otherwise navigate
      if (currentEvent.linkUrl.startsWith('http://') || currentEvent.linkUrl.startsWith('https://')) {
        window.open(currentEvent.linkUrl, '_blank');
      } else {
        navigate(currentEvent.linkUrl);
      }
    }
  };
  
  return (
    <div className="relative">
      <div 
        className="w-full h-[60vh] object-cover transition-opacity duration-500 relative bg-muted"
        style={{
          backgroundImage: currentEvent.image ? `url(${currentEvent.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-accent-coral/60 z-10" />
        {currentEvent.type === 'IMAGE' && currentEvent.linkUrl && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={handleImageClick}
            aria-label={currentEvent.linkText || 'Click to learn more'}
          />
        )}
        {currentEvent.type === 'EVENT' && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={handleImageClick}
            aria-label="View event details"
          />
        )}
      </div>
      
      {/* Hero Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-white pointer-events-none">
        <div className="container mx-auto max-w-7xl">
          
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                {currentEvent.category && (
                  <Badge variant="secondary" className="bg-accent-coral text-white shadow-lg shadow-primary/50">
                    {currentEvent.category}
                  </Badge>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{currentEvent.type === 'EVENT' ? 'Featured Event' : 'Featured'}</span>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                {currentEvent.title}
              </h1>
              
              {currentEvent.type === 'EVENT' ? (
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  {currentEvent.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <div>
                        <div className="font-semibold">{formatDate(currentEvent.date)}</div>
                      </div>
                    </div>
                  )}
                  {currentEvent.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">{currentEvent.time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <div>
                      {currentEvent.venue && (
                        <div className="font-semibold">{currentEvent.venue}</div>
                      )}
                      <div className="text-sm">{currentEvent.location}</div>
                    </div>
                  </div>
                  {currentEvent.price && (
                    <div className="text-lg font-semibold">{currentEvent.price}</div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {currentEvent.description && (
                    <p className="text-lg text-white/90">{currentEvent.description}</p>
                  )}
                  {currentEvent.linkUrl && currentEvent.linkText && (
                    <div className="pointer-events-auto pt-2">
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleImageClick}
                        className="bg-accent-coral text-white shadow-lg shadow-primary/50 hover:bg-accent-coral/90 hover:shadow-xl hover:shadow-primary/60 transition-all"
                      >
                        {currentEvent.linkText}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {currentEvent.type === 'EVENT' && (
              <div className="flex gap-3 pointer-events-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`bg-glass-bg backdrop-blur-sm border-glass-border hover:bg-accent-coral hover:text-white hover:shadow-lg hover:shadow-primary/50 ${isFavorited ? 'text-accent-coral' : 'text-foreground'}`}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                    {isFavorited ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-glass-bg backdrop-blur-sm border-glass-border text-foreground hover:bg-accent-coral hover:text-white hover:shadow-lg hover:shadow-primary/50"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Controls */}
      {featuredEvents.length > 1 && (
        <>
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30">
            <Button
              variant="secondary"
              size="icon"
              onClick={goToPrevious}
              className="bg-glass-bg backdrop-blur-sm border-glass-border text-foreground hover:bg-gradient-to-r hover:from-primary hover:to-accent-coral hover:text-white hover:shadow-lg hover:shadow-primary/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30">
            <Button
              variant="secondary"
              size="icon"
              onClick={goToNext}
              className="bg-glass-bg backdrop-blur-sm border-glass-border text-foreground hover:bg-gradient-to-r hover:from-primary hover:to-accent-coral hover:text-white hover:shadow-lg hover:shadow-primary/50"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Event Indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
            <div className="flex gap-2">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToEvent(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 shadow-lg ${
                    index === currentEventIndex
                      ? 'bg-accent-coral scale-125 shadow-primary/50'
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};