import { Heart, Share2, MapPin, Calendar, Clock, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const Hero = () => {
  const [isFavorited, setIsFavorited] = useState(false);
  
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 z-10" />
      <img 
        src="/src/assets/event-concert.jpg" 
        alt="Summer Music Festival 2025"
        className="w-full h-[60vh] object-cover"
        loading="eager"
      />
      
      {/* Hero Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-white">
        <div className="container mx-auto max-w-7xl">
          <Button
            variant="secondary"
            className="mb-6 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  Music
                </Badge>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>132 interested</span>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Summer Music Festival 2025
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">Tuesday</div>
                    <div className="text-sm">July 15, 2025</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">6:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">Riverside Park Amphitheater</div>
                    <div className="text-sm">123 River Road, Downtown, City 12345</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setIsFavorited(!isFavorited)}
                className={`bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 ${isFavorited ? 'text-red-400' : 'text-white'}`}
              >
                <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Saved' : 'Save'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};