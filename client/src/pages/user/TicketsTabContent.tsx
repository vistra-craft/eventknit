/**
 * Tickets Tab Content — inline tab for DashboardHome
 *
 * Shows all registered event tickets with filter tabs and quick actions.
 * Adapted from MyTickets.tsx but without standalone page wrapper.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Download, Share2, QrCode, Send, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loader } from '../../components/ui/loader';
import EmptyState from '../../components/EmptyState';
import { getUserRegisteredEvents } from '../../lib/event-api';
import { downloadTicketPDF, resendTicketEmail } from '../../lib/ticket-api';
import { shareEvent } from '../../lib/utils/share';
import { useToast } from '../../hooks/useToast';
import { showErrorToast } from '../../lib/utils/error';

interface Ticket {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'upcoming' | 'completed';
  ticketId: string;
  registrationId?: string;
  image: string;
  emailStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | null;
}

const TicketsTabContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await getUserRegisteredEvents({ page: 1, limit: 100 });
        if (response.success && response.data) {
          setTickets(response.data.events.map((event: { id: string; title: string; date?: string; location?: string; venue?: string; status?: string; backupCode?: string; registrationId?: string; image?: string; ticketEmailStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | null }) => ({
            id: event.id,
            title: event.title,
            date: event.date || '',
            location: event.venue ? `${event.venue}, ${event.location || ''}` : (event.location || ''),
            status: (event.status as 'upcoming' | 'completed') || 'upcoming',
            ticketId: event.backupCode || `TKT-${event.id.slice(0, 8).toUpperCase()}`,
            registrationId: event.registrationId,
            image: event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
            emailStatus: event.ticketEmailStatus,
          })));
        }
      } catch (error) {
        showErrorToast(toast, error, 'Load failed', 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [toast]);

  const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  };

  const handleDownload = async (ticket: Ticket) => {
    if (!ticket.registrationId) {
      toast({ title: 'Unavailable', description: 'Ticket not available', variant: 'destructive' });
      return;
    }
    setDownloadingId(ticket.id);
    try {
      await downloadTicketPDF(ticket.registrationId);
      toast({ title: 'Downloaded', description: 'Ticket PDF downloaded' });
    } catch (error) {
      showErrorToast(toast, error, 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (ticket: Ticket) => {
    const shared = await shareEvent(ticket.title, ticket.id);
    toast({ title: shared ? 'Shared' : 'Link Copied', description: shared ? 'Event shared' : 'Link copied' });
  };

  const handleResendEmail = async (ticket: Ticket) => {
    if (!ticket.registrationId) return;
    setResendingId(ticket.id);
    try {
      await resendTicketEmail(ticket.registrationId);
      setTickets((prev) =>
        prev.map((item) =>
          item.id === ticket.id ? { ...item, emailStatus: 'PENDING' as const } : item
        )
      );
      toast({ title: 'Sent', description: 'Ticket email resend started' });
    } catch (error) {
      showErrorToast(toast, error, 'Resend failed');
    } finally {
      setResendingId(null);
    }
  };

  const filterTabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'upcoming' as const, label: 'Upcoming' },
    { key: 'completed' as const, label: 'Past' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader size="default" />
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-6 border border-border">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              filter === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
            {tab.key === 'all' && tickets.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">({tickets.length})</span>
            )}
          </button>
        ))}
      </div>

      {filteredTickets.length > 0 ? (
        <div className="space-y-3">
          {filteredTickets.map((ticket, index) => (
            <div
              key={ticket.id}
              onClick={() => navigate(`/user/event/${ticket.id}`)}
              className="flex items-center gap-4 p-4 bg-card border border-border/40 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer group animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {/* Thumbnail */}
              <img
                src={ticket.image}
                alt={ticket.title}
                className={`w-16 h-16 rounded-lg object-cover flex-shrink-0 ${ticket.status === 'completed' ? 'grayscale-[30%]' : ''}`}
                loading="lazy"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {ticket.title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] flex-shrink-0 border-0 ${
                      ticket.status === 'upcoming' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {ticket.status === 'upcoming' ? 'Upcoming' : 'Past'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {formatDate(ticket.date)}
                  <span className="opacity-30">|</span>
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{ticket.location}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <QrCode className="w-3 h-3" />
                  <span className="font-mono">{ticket.ticketId}</span>
                  {ticket.emailStatus === 'FAILED' && ticket.registrationId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] text-destructive"
                      disabled={resendingId === ticket.id}
                      onClick={(e) => { e.stopPropagation(); handleResendEmail(ticket); }}
                    >
                      {resendingId === ticket.id ? '...' : 'Resend Email'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Actions — visible on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={downloadingId === ticket.id}
                  onClick={(e) => { e.stopPropagation(); handleDownload(ticket); }}
                  title="Download ticket"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); handleShare(ticket); }}
                  title="Share event"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
                {ticket.status === 'upcoming' && ticket.registrationId && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); navigate('/user/dashboard?section=ticket-transfer', { state: { registrationId: ticket.registrationId, eventTitle: ticket.title } }); }}
                      title="Transfer ticket"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); navigate('/user/dashboard?section=ticket-resale', { state: { registrationId: ticket.registrationId, eventTitle: ticket.title } }); }}
                      title="Resell ticket"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={QrCode}
          title={filter === 'all' ? 'No Tickets Yet' : filter === 'upcoming' ? 'No Upcoming Tickets' : 'No Past Tickets'}
          description="Register for an event to get your tickets."
          action={{ label: 'Browse Events', onClick: () => navigate('/') }}
        />
      )}
    </div>
  );
};

export default TicketsTabContent;
