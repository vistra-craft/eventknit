import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Heart,
  Trash2,
  ExternalLink,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { EventThumbnail } from "../../components/ui/event-thumbnail";
import { useToast } from "../../hooks/use-toast";
import EmptyState from "../../components/EmptyState";

interface SavedEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  category?: string;
  price?: string;
  savedDate: string;
}

const SavedEvents: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // In a real implementation, fetch saved events from API
    // For now, using mock data
    const fetchSavedEvents = async () => {
      try {
        setLoading(true);
        
        // TODO: Replace with actual API call
        // const response = await getSavedEvents();
        
        // Mock data for demonstration
        const mockEvents: SavedEvent[] = [
          // Initially empty - user will save events
        ];
        
        setSavedEvents(mockEvents);
        setFilteredEvents(mockEvents);
      } catch (error) {
        console.error("Error fetching saved events:", error);
        toast({
          title: "Error",
          description: "Failed to load saved events",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSavedEvents();
  }, [toast]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = savedEvents.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(savedEvents);
    }
  }, [searchQuery, savedEvents]);

  const handleRemoveFromSaved = async (eventId: string) => {
    try {
      // TODO: Call API to remove from saved events
      // await removeSavedEvent(eventId);
      
      setSavedEvents(prev => prev.filter(event => event.id !== eventId));
      toast({
        title: "Removed",
        description: "Event removed from saved list",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove event",
        variant: "destructive",
      });
    }
  };

  const handleRegisterForEvent = (eventId: string) => {
    // Navigate to event page for registration
    navigate(`/event/${eventId}`);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Saved Events</h1>
        <p className="text-muted-foreground">
          Events you've bookmarked for later
        </p>
      </div>

      {/* Search */}
      {savedEvents.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search saved events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading saved events...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card 
              key={event.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative overflow-hidden">
                <EventThumbnail
                  src={event.image}
                  alt={event.title}
                  category={event.category || ''}
                  size="md"
                />
                <button
                  onClick={() => handleRemoveFromSaved(event.id)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                  aria-label="Remove from saved"
                >
                  <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                </button>
                {event.category && (
                  <div className="absolute top-4 left-4 z-10">
                    <Badge variant="secondary" className="bg-white/90 text-gray-800">
                      {event.category}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  {event.price && (
                    <div className="text-sm font-medium text-primary">
                      From {event.price}
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mb-4">
                  Saved on {new Date(event.savedDate).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Button 
                    className="flex-1"
                    onClick={() => handleRegisterForEvent(event.id)}
                  >
                    Register Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/event/${event.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRemoveFromSaved(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title={searchQuery ? "No Events Found" : "No Saved Events"}
          description={
            searchQuery
              ? "Try adjusting your search criteria"
              : "You haven't saved any events yet. Browse events and click the heart icon to save them for later!"
          }
          action={
            searchQuery
              ? {
                  label: "Clear Search",
                  onClick: () => setSearchQuery(""),
                }
              : {
                  label: "Browse Events",
                  onClick: () => navigate('/'),
                }
          }
        />
      )}
    </div>
  );
};

export default SavedEvents;
