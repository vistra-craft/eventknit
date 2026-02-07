import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Download, Share2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Loader } from "../../components/ui/loader";
import { Badge } from "../../components/ui/badge";
import EmptyState from "../../components/EmptyState";
import { getUserRegisteredEvents } from "../../lib/event-api";
import { shareEvent } from "../../lib/utils/share";
import { downloadTicket } from "../../lib/utils/ticket";
import { useToast } from "../../hooks/useToast";

interface EventData {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
}

interface User {
  name: string;
  email: string;
  initials: string;
}

export interface DashboardHomeProps {
  user: User;
  eventData?: unknown;
  registration?: unknown;
}

type FilterTab = 'all' | 'upcoming' | 'completed';

const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserRegisteredEvents({ page: 1, limit: 100 });
      if (response.success && response.data) {
        setEvents(response.data.events.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          type: event.type || 'In-Person',
          image: event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
          status: event.status || 'upcoming',
        })));
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    if (activeTab === 'upcoming') return events.filter(e => e.status === 'upcoming');
    if (activeTab === 'completed') return events.filter(e => e.status === 'completed');
    return events;
  }, [activeTab, events]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  const handleShare = async (event: EventData) => {
    const shared = await shareEvent(event.title, event.id);
    toast({ title: shared ? "Shared" : "Link Copied", description: shared ? "Event shared" : "Link copied to clipboard" });
  };

  const handleDownload = (event: EventData) => {
    try {
      downloadTicket({
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        attendeeName: user.name,
        attendeeEmail: user.email,
        ticketType: event.type,
        ticketId: `${event.id}-${Date.now()}`,
      });
      toast({ title: "Downloaded", description: "Ticket downloaded" });
    } catch {
      toast({ title: "Error", description: "Failed to download", variant: "destructive" });
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Past' },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Events</h1>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as FilterTab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size="default" />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/user/event/${event.id}`)}
              className="flex gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <img
                src={event.image}
                alt={event.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={`text-xs flex-shrink-0 ${
                      event.status === 'upcoming' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground mb-2">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(event.date)}
                  </p>
                  <p className="flex items-center gap-1.5 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {event.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleDownload(event); }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleShare(event); }}
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title={activeTab === 'all' ? "No Events Yet" : activeTab === 'upcoming' ? "No Upcoming Events" : "No Past Events"}
          description={activeTab === 'all'
            ? "You haven't registered for any events yet."
            : activeTab === 'upcoming'
            ? "You don't have any upcoming events."
            : "You haven't attended any events yet."
          }
          action={{ label: "Browse Events", onClick: () => navigate('/') }}
        />
      )}
    </div>
  );
};

export default DashboardHome;
