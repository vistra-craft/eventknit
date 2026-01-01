import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Download,
  Share2,
  QrCode,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { EventThumbnail } from "../../components/ui/event-thumbnail";
import { getUserRegisteredEvents } from "../../lib/event-api";
import { downloadTicket } from "../../lib/utils/ticket";
import { shareEvent } from "../../lib/utils/share";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/useAuth";
import EmptyState from "../../components/EmptyState";

interface TicketEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  category?: string;
  ticketId?: string;
}

const MyTickets: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [tickets, setTickets] = useState<TicketEvent[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const user = authUser ? {
    name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email || 'User',
    email: authUser.email || '',
  } : {
    name: 'User',
    email: '',
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await getUserRegisteredEvents({ page: 1, limit: 100 });
        if (response.success && response.data) {
          const eventsWithTickets = response.data.events.map((event: any) => ({
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            type: event.type || 'In-Person',
            image: event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
            status: event.status || 'upcoming',
            category: event.category || '',
            ticketId: event.ticketId || `TKT-${event.id.slice(0, 8).toUpperCase()}`,
          }));
          setTickets(eventsWithTickets);
          setFilteredTickets(eventsWithTickets);
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast({
          title: "Error",
          description: "Failed to load tickets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [toast]);

  useEffect(() => {
    let filtered = tickets;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  }, [searchQuery, statusFilter, tickets]);

  const handleDownloadTicket = (ticket: TicketEvent) => {
    try {
      downloadTicket({
        eventTitle: ticket.title,
        eventDate: ticket.date,
        eventLocation: ticket.location,
        attendeeName: user.name,
        attendeeEmail: user.email,
        ticketType: ticket.type,
        ticketId: ticket.ticketId || `TKT-${ticket.id.slice(0, 8)}`,
      });
      toast({
        title: "Downloaded",
        description: "Ticket downloaded successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to download ticket",
        variant: "destructive",
      });
    }
  };

  const handleShareTicket = async (ticket: TicketEvent) => {
    const shared = await shareEvent(ticket.title, ticket.id);
    if (shared) {
      toast({
        title: "Shared",
        description: "Event shared successfully",
      });
    } else {
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">My Tickets</h1>
        <p className="text-muted-foreground">
          View and manage all your event tickets
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
          >
            Past
          </Button>
        </div>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tickets...</p>
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate(`/user/event/${ticket.id}`)}
            >
              <div className="relative overflow-hidden">
                <EventThumbnail
                  src={ticket.image}
                  alt={ticket.title}
                  category={ticket.category || ''}
                  size="md"
                />
                <div className="absolute top-4 left-4 z-10">
                  <Badge className={`${getStatusColor(ticket.status || 'upcoming')} border-0`}>
                    {(ticket.status || 'upcoming').charAt(0).toUpperCase() + (ticket.status || 'upcoming').slice(1)}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {ticket.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{ticket.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{ticket.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="w-4 h-4" />
                    <span className="font-mono text-xs">{ticket.ticketId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadTicket(ticket);
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareTicket(ticket);
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={QrCode}
          title={searchQuery || statusFilter !== 'all' ? "No Tickets Found" : "No Tickets Yet"}
          description={
            searchQuery || statusFilter !== 'all'
              ? "Try adjusting your search or filter criteria"
              : "You don't have any tickets yet. Register for an event to get started!"
          }
          action={
            searchQuery || statusFilter !== 'all'
              ? {
                  label: "Clear Filters",
                  onClick: () => {
                    setSearchQuery("");
                    setStatusFilter('all');
                  },
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

export default MyTickets;
