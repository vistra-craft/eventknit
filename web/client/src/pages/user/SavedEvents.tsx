import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Heart, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loader } from "../../components/ui/loader";
import BackButton from "../../components/BackButton";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../hooks/useToast";
import { getSavedEvents, unsaveEvent, type SavedEventData } from "../../lib/saved-events-api";

const SavedEvents: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<SavedEventData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSavedEvents({});
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching saved events:", error);
      toast({ title: "Error", description: "Failed to load saved events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRemove = async (eventId: string) => {
    try {
      await unsaveEvent(eventId);
      setEvents(prev => prev.filter(e => e.eventId !== eventId));
      toast({ title: "Removed", description: "Event removed from saved list" });
    } catch {
      toast({ title: "Error", description: "Failed to remove event", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null || price === 0) return 'Free';
    return `${currency} ${price.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <BackButton to="/user/dashboard" label="Dashboard" />

      <h1 className="text-2xl font-bold text-foreground mb-6">Saved Events</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size="default" />
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.map((saved) => (
            <div
              key={saved.id}
              onClick={() => navigate(`/event/${saved.eventId}`)}
              className="flex gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <img
                src={saved.event.coverImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop"}
                alt={saved.event.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {saved.event.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs flex-shrink-0 bg-primary/10 text-primary">
                    {formatPrice(saved.event.basePrice, saved.event.currency)}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground mb-2">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(saved.event.startDate)}
                  </p>
                  <p className="flex items-center gap-1.5 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {saved.event.venueName || saved.event.location || 'TBA'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => { e.stopPropagation(); navigate(`/event/${saved.eventId}`); }}
                  >
                    View Event
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleRemove(saved.eventId); }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="No Saved Events"
          description="Browse events and click the heart icon to save them for later."
          action={{ label: "Browse Events", onClick: () => navigate('/') }}
        />
      )}
    </div>
  );
};

export default SavedEvents;
