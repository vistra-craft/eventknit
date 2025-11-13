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
  const [loading, setLoading] = useState(true);
  
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
        // Set empty array on error so UI doesn't hang
        setFeaturedEvents([]);
      } finally {
        setLoading(false);
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

  // Show placeholder if no events
  if (!loading && featuredEvents.length === 0) {
    return (
      <div className="relative">
        <div 
          className="w-full h-[60vh] object-cover transition-opacity duration-500 relative bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30 z-10" />
          
          {/* Placeholder Content */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="container mx-auto max-w-7xl px-6 text-center">
              <div className="space-y-6 max-w-3xl mx-auto">
                <Badge variant="secondary" className="bg-primary text-primary-foreground mb-4">
                  Discover Amazing Events
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
                  Find Your Next Unforgettable Experience
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
  
  // Show loading state
  if (loading) {
    return (
      <div className="relative">
        <div 
          className="w-full h-[60vh] object-cover transition-opacity duration-500 relative bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30 z-10" />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading featured events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const currentEvent = featuredEvents[currentEventIndex];
  
  // Format date for display
  const formatDate = (dateString: string) => {
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
    navigate(`/event/${currentEvent.eventId}`);
  };
  
  return (
    <div className="relative">
      <div 
        className="w-full h-[60vh] object-cover transition-opacity duration-500 cursor-pointer hover:opacity-90 relative bg-muted"
        onClick={handleImageClick}
        style={{
          backgroundImage: currentEvent.image ? `url(${currentEvent.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 z-10" />
      </div>
      
      {/* Hero Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-white pointer-events-none">
        <div className="container mx-auto max-w-7xl">
          
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                {currentEvent.category && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    {currentEvent.category}
                  </Badge>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>Featured Event</span>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                {currentEvent.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">{formatDate(currentEvent.date)}</div>
                  </div>
                </div>
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
            </div>
            
            <div className="flex gap-3 pointer-events-auto">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setIsFavorited(!isFavorited)}
                className={`bg-glass-bg backdrop-blur-sm border-glass-border hover:bg-eventknit hover:text-eventknit-foreground hover:border-eventknit ${isFavorited ? 'text-red-400' : 'text-foreground'}`}
              >
                <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Saved' : 'Save'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="bg-glass-bg backdrop-blur-sm border-glass-border text-foreground hover:bg-eventknit hover:text-eventknit-foreground hover:border-eventknit"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
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
              className="bg-glass-bg backdrop-blur-sm border-glass-border text-foreground hover:bg-eventknit hover:text-eventknit-foreground hover:border-eventknit"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30">
            <Button
              variant="secondary"
              size="icon"
              onClick={goToNext}
              className="bg-glass-bg backdrop-blur-sm border-glass-border text-foreground hover:bg-eventknit hover:text-eventknit-foreground hover:border-eventknit"
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
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentEventIndex
                      ? 'bg-eventknit scale-125'
                      : 'bg-eventknit/30 hover:bg-eventknit/50'
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