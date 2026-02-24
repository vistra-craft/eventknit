import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Download, Share2, QrCode } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loader } from "../../components/ui/loader";
import BackButton from "../../components/BackButton";
import EmptyState from "../../components/EmptyState";
import { getUserRegisteredEvents } from "../../lib/event-api";
import { downloadTicketPDF } from "../../lib/ticket-api";
import { shareEvent } from "../../lib/utils/share";
import { useToast } from "../../hooks/useToast";

interface Ticket {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'upcoming' | 'completed';
  ticketId: string;
  registrationId?: string;
  image: string;
}

const MyTickets: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await getUserRegisteredEvents({ page: 1, limit: 100 });
        if (response.success && response.data) {
          setTickets(response.data.events.map((event: { id: string; title: string; date?: string; location?: string; venue?: string; status?: string; backupCode?: string; registrationId?: string; image?: string }) => ({
            id: event.id,
            title: event.title,
            date: event.date || "",
            location: event.venue ? `${event.venue}, ${event.location || ""}` : (event.location || ""),
            status: (event.status as 'upcoming' | 'completed') || 'upcoming',
            ticketId: event.backupCode || `TKT-${event.id.slice(0, 8).toUpperCase()}`,
            registrationId: event.registrationId,
            image: event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
          })));
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast({ title: "Error", description: "Failed to load tickets", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [toast]);

  const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  const handleDownload = async (ticket: Ticket) => {
    if (!ticket.registrationId) {
      toast({ title: "Error", description: "Ticket not available", variant: "destructive" });
      return;
    }
    setDownloadingId(ticket.id);
    try {
      await downloadTicketPDF(ticket.registrationId);
      toast({ title: "Downloaded", description: "Ticket PDF downloaded" });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Download failed", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (ticket: Ticket) => {
    const shared = await shareEvent(ticket.title, ticket.id);
    toast({ title: shared ? "Shared" : "Link Copied", description: shared ? "Event shared" : "Link copied" });
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Past' },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <BackButton to="/user/dashboard" label="Dashboard" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Tickets</h1>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as 'all' | 'upcoming' | 'completed')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader size="default" />
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/user/event/${ticket.id}`)}
              className="flex gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <img
                src={ticket.image}
                alt={ticket.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {ticket.title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={`text-xs flex-shrink-0 ${
                      ticket.status === 'upcoming' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {ticket.status === 'upcoming' ? 'Upcoming' : 'Past'}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground mb-2">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(ticket.date)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {ticket.location}
                  </p>
                  <p className="flex items-center gap-1.5 font-mono text-xs">
                    <QrCode className="w-3.5 h-3.5" />
                    {ticket.ticketId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={downloadingId === ticket.id}
                    onClick={(e) => { e.stopPropagation(); handleDownload(ticket); }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    {downloadingId === ticket.id ? "..." : "Download"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleShare(ticket); }}
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
          icon={QrCode}
          title={filter === 'all' ? "No Tickets Yet" : filter === 'upcoming' ? "No Upcoming Tickets" : "No Past Tickets"}
          description="Register for an event to get your tickets."
          action={{ label: "Browse Events", onClick: () => navigate('/') }}
        />
      )}
    </div>
  );
};

export default MyTickets;
