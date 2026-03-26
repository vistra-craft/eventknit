/**
 * Tickets Tab Content — inline tab for DashboardHome
 *
 * Shows all registered event tickets with filter tabs and quick actions.
 * Clicking a ticket card navigates to the ticket detail view (TicketViewPage).
 * Action icons are always visible for better discoverability.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Download, Share2, QrCode, Send, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loader } from '../../components/ui/loader';
import EmptyState from '../../components/EmptyState';
import FilterTabs from '../../components/dashboard/FilterTabs';
import { getUserRegisteredEvents } from '../../lib/event-api';
import { downloadTicketPDF, resendTicketEmail } from '../../lib/ticket-api';
import { shareEvent } from '../../lib/utils/share';
import { useToast } from '../../hooks/useToast';
import { showErrorToast } from '../../lib/utils/error';

interface Ticket {
  id: string;
  slug?: string | null;
  title: string;
  date: string;
  location: string;
  status: 'upcoming' | 'completed';
  ticketId: string;
  registrationId?: string;
  image: string;
  emailStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | null;
  totalAmount?: number;
  paymentStatus?: string | null;
  currency?: string;
  isFree?: boolean;
}

type TicketFilter = 'all' | 'upcoming' | 'completed';

const TicketsTabContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TicketFilter>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await getUserRegisteredEvents({ page: 1, limit: 100 });
        if (response.success && response.data) {
          setTickets(response.data.events.map((event: { id: string; slug?: string | null; title: string; date?: string; location?: string; venue?: string; status?: string; backupCode?: string; registrationId?: string; image?: string; ticketEmailStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | null; totalAmount?: number; paymentStatus?: string | null; currency?: string; isFree?: boolean }) => ({
            id: event.id,
            slug: event.slug,
            title: event.title,
            date: event.date || '',
            location: event.venue ? `${event.venue}, ${event.location || ''}` : (event.location || ''),
            status: (event.status as 'upcoming' | 'completed') || 'upcoming',
            ticketId: event.backupCode || `TKT-${event.id.slice(0, 8).toUpperCase()}`,
            registrationId: event.registrationId,
            image: event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
            emailStatus: event.ticketEmailStatus,
            totalAmount: event.totalAmount,
            paymentStatus: event.paymentStatus,
            currency: event.currency,
            isFree: event.isFree,
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
    const shared = await shareEvent(ticket.title, ticket.slug ?? ticket.id);
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

  /** Navigate to the ticket detail view instead of event details */
  const handleTicketClick = (ticket: Ticket) => {
    if (ticket.registrationId) {
      navigate(`/user/tickets/${ticket.registrationId}`);
    } else {
      // Fallback to event view if no registrationId
      navigate(`/user/event/${ticket.id}`);
    }
  };

  const filterTabs = [
    { key: 'all' as TicketFilter, label: 'All', count: tickets.length },
    { key: 'upcoming' as TicketFilter, label: 'Upcoming', count: tickets.filter(t => t.status === 'upcoming').length },
    { key: 'completed' as TicketFilter, label: 'Past', count: tickets.filter(t => t.status === 'completed').length },
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
      {tickets.length > 0 && (
        <FilterTabs
          tabs={filterTabs}
          activeFilter={filter}
          onFilterChange={setFilter}
        />
      )}

      {filteredTickets.length > 0 ? (
        <div className="space-y-3">
          {filteredTickets.map((ticket, index) => (
            <div
              key={ticket.id}
              onClick={() => handleTicketClick(ticket)}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-card border border-border/40 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer group animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {/* Thumbnail */}
              <img
                src={ticket.image}
                alt={ticket.title}
                className={`w-full sm:w-16 h-32 sm:h-16 rounded-lg object-cover flex-shrink-0 ${ticket.status === 'completed' ? 'grayscale-[30%]' : ''}`}
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
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <Calendar className="w-3 h-3" />
                  {formatDate(ticket.date)}
                  <span className="opacity-30">|</span>
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{ticket.location}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <QrCode className="w-3 h-3" />
                  <span className="font-mono">{ticket.ticketId}</span>
                  {!ticket.isFree && ticket.totalAmount != null && ticket.totalAmount > 0 && (
                    <>
                      <span className="opacity-30">|</span>
                      <span className="font-medium text-foreground">{ticket.currency || 'KES'} {ticket.totalAmount.toLocaleString()}</span>
                      {ticket.paymentStatus && (
                        <Badge
                          className={`text-[9px] px-1 py-0 border-0 ${
                            ticket.paymentStatus === 'COMPLETED'
                              ? 'bg-success/10 text-success'
                              : ticket.paymentStatus === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {ticket.paymentStatus === 'COMPLETED' ? 'Paid' : ticket.paymentStatus}
                        </Badge>
                      )}
                    </>
                  )}
                  {ticket.isFree && (
                    <>
                      <span className="opacity-30">|</span>
                      <span className="text-success font-medium">Free</span>
                    </>
                  )}
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

              {/* Actions — always visible for better discoverability */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={downloadingId === ticket.id}
                  onClick={(e) => { e.stopPropagation(); handleDownload(ticket); }}
                  title="Download ticket"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
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
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); navigate('/user/ticket-transfer', { state: { registrationId: ticket.registrationId, eventTitle: ticket.title } }); }}
                      title="Transfer ticket"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); navigate('/user/ticket-resale', { state: { registrationId: ticket.registrationId, eventTitle: ticket.title } }); }}
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
