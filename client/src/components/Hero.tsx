import { Heart, Share2, MapPin, Calendar, Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Placeholder event data for hero section
const heroEvents = [
  {
    id: "1",
    title: "Summer Music Festival 2025",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&h=1080&fit=crop",
    category: "Music",
    date: "Tuesday, July 15, 2025",
    time: "6:00 PM",
    venue: "Riverside Park Amphitheater",
    location: "123 River Road, Downtown, City 12345",
    interested: 132,
    price: "From $45"
  },
  {
    id: "2",
    title: "Tech Innovation Summit 2024",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1920&h=1080&fit=crop",
    category: "Technology",
    date: "Friday, March 15, 2024",
    time: "9:00 AM",
    venue: "Moscone Center",
    location: "San Francisco, CA",
    interested: 89,
    price: "From $299"
  },
  {
    id: "3",
    title: "Art & Wine Festival",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop",
    category: "Arts & Culture",
    date: "Saturday, June 8, 2024",
    time: "2:00 PM",
    venue: "Central Park Pavilion",
    location: "New York, NY",
    interested: 156,
    price: "From $25"
  },
  {
    id: "4",
    title: "Food & Drink Expo",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&h=1080&fit=crop",
    category: "Food & Drink",
    date: "Sunday, April 21, 2024",
    time: "11:00 AM",
    venue: "Convention Center",
    location: "Chicago, IL",
    interested: 203,
    price: "From $35"
  }
];

export const Hero = () => {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const currentEvent = heroEvents[currentEventIndex];
  
  // Auto-rotation logic
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentEventIndex((prevIndex) => 
        prevIndex === heroEvents.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change every 5 seconds
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);
  
  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentEventIndex((prevIndex) => 
      prevIndex === 0 ? heroEvents.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentEventIndex((prevIndex) => 
      prevIndex === heroEvents.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const goToEvent = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentEventIndex(index);
  };

  const handleImageClick = () => {
    navigate(`/event/${currentEvent.id}`);
  };
  
  return (
    <div className="relative">
      <div 
        className="w-full h-[60vh] object-cover transition-opacity duration-500 cursor-pointer hover:opacity-90 relative"
        onClick={handleImageClick}
        style={{
          backgroundImage: `url(${currentEvent.image})`,
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
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  {currentEvent.category}
                </Badge>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{currentEvent.interested} interested</span>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                {currentEvent.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">{currentEvent.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">{currentEvent.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">{currentEvent.venue}</div>
                    <div className="text-sm">{currentEvent.location}</div>
                  </div>
                </div>
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
          {heroEvents.map((_, index) => (
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
    </div>
  );
};