/**
 * Dashboard Home — Attendee Events Hub
 *
 * Modern layout inspired by Lu.ma / Eventbrite:
 * - Personalized greeting with time-aware message
 * - Shared EventCard component for Attending & Saved tabs
 * - Filter tabs (All/Upcoming/Past) on all content sections
 * - Tabs: Attending | Saved | Tickets
 */

import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Calendar,
  Heart,
  Ticket,
  Sparkles,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Loader } from '../../components/ui/loader';
import { Badge } from '../../components/ui/badge';
import EmptyState from '../../components/EmptyState';
import EventCard from '../../components/dashboard/EventCard';
import FilterTabs from '../../components/dashboard/FilterTabs';
import { OrganizingEventCard } from '@/components/organizer-ui/OrganizingEventCard';
import { KYCRequiredBanner } from '../../components/KYCRequiredBanner';
import { useMyEvents } from '../../hooks/useMyEvents';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import { shareEvent } from '../../lib/utils/share';
import { downloadTicket } from '../../lib/utils/ticket';
import { unsaveEvent } from '../../lib/saved-events-api';
import { useToast } from '../../hooks/useToast';
import { showErrorToast } from '../../lib/utils/error';
import { getVerificationStatus, type VerificationStatus } from '../../lib/verification-api';
import {
  TAB_LABELS,
  EMPTY_STATE_MESSAGES,
  CTA_LABELS,
} from '../../constants/navigationLabels';

import TicketsTabContent from './TicketsTabContent';

export interface DashboardHomeProps {
  user?: {
    name: string;
    email: string;
    initials: string;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || fullName;
}

/** Derive upcoming/past status from a date string */
function deriveStatus(dateString: string): 'upcoming' | 'completed' {
  return new Date(dateString).getTime() > Date.now() ? 'upcoming' : 'completed';
}

type EventFilter = 'all' | 'upcoming' | 'completed';

const FILTER_TABS: { key: EventFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Past' },
];

// ─── Component ──────────────────────────────────────────────────────────────────

const DashboardHome = ({ user: userProp }: DashboardHomeProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const user = userProp ?? {
    name: authUser ? `${authUser.firstName ?? ''} ${authUser.lastName ?? ''}`.trim() || authUser.email || 'User' : 'User',
    email: authUser?.email ?? '',
    initials: authUser?.firstName?.[0]?.toUpperCase() ?? 'U',
  };

  const {
    attendingEvents,
    organizingEvents,
    savedEvents,
    attendingLoading,
    organizingLoading,
    savedLoading,
    refreshSaved,
  } = useMyEvents();

  const [currentTab, setCurrentTab] = useState<'attending' | 'my-events' | 'saved' | 'tickets'>('attending');
  const [attendingFilter, setAttendingFilter] = useState<EventFilter>('all');
  const [savedFilter, setSavedFilter] = useState<EventFilter>('all');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);

  useEffect(() => {
    const loadVerification = async () => {
      try {
        const res = await getVerificationStatus();
        if (res.success) setVerificationStatus(res.data);
      } catch (err) {
        console.error('Failed to load verification status:', err);
      }
    };
    loadVerification();
  }, []);

  if (authUser?.role === UserRole.ORGANIZER) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  const pendingEvents = organizingEvents.filter(
    event => event.status.toLowerCase() === 'pending'
  );

  // Split attending events
  const upcomingEvents = attendingEvents.filter(e => !e.status || e.status === 'upcoming' || e.status === 'ongoing');
  const pastAttendingEvents = attendingEvents.filter(e => e.status === 'completed');

  // Filter attending events
  const filteredAttendingEvents = attendingFilter === 'all'
    ? [...upcomingEvents, ...pastAttendingEvents]
    : attendingFilter === 'upcoming'
      ? upcomingEvents
      : pastAttendingEvents;

  // Filter saved events (derive status from date)
  const filteredSavedEvents = savedFilter === 'all'
    ? savedEvents
    : savedEvents.filter(e => deriveStatus(e.date) === savedFilter);

  const savedUpcomingCount = savedEvents.filter(e => deriveStatus(e.date) === 'upcoming').length;
  const savedPastCount = savedEvents.filter(e => deriveStatus(e.date) === 'completed').length;

  const handleShare = async (event: { title: string; id: string; slug?: string | null }) => {
    const shared = await shareEvent(event.title, event.slug ?? event.id);
    toast({
      title: shared ? 'Shared' : 'Link Copied',
      description: shared ? 'Event shared' : 'Link copied to clipboard',
    });
  };

  const handleDownload = (event: { id: string; title: string; date: string; location: string }) => {
    try {
      downloadTicket({
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        attendeeName: user.name,
        attendeeEmail: user.email,
        ticketType: 'Standard',
        ticketId: `${event.id}-${Date.now()}`,
      });
      toast({ title: 'Downloaded', description: 'Ticket downloaded' });
    } catch (err) {
      showErrorToast(toast, err, 'Download failed');
    }
  };

  const handleUnsave = async (eventId: string) => {
    try {
      await unsaveEvent(eventId);
      toast({ title: 'Removed', description: 'Event removed from saved' });
      refreshSaved();
    } catch (err) {
      showErrorToast(toast, err, 'Failed to remove');
    }
  };

  // Tabs
  const tabs = [
    { key: 'attending' as const, label: TAB_LABELS.ATTENDING },
    ...(pendingEvents.length > 0 ? [
      { key: 'my-events' as const, label: 'My Events', badge: pendingEvents.length }
    ] : []),
    { key: 'saved' as const, label: TAB_LABELS.SAVED, icon: Bookmark },
    { key: 'tickets' as const, label: 'Tickets', icon: Ticket },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
      {/* KYC Banner */}
      {(() => {
        const hasApprovedPaidEvents = organizingEvents.some(
          event => event.status.toLowerCase() !== 'pending' && !event.isFree
        );
        const hasPendingPaidEvents = organizingEvents.some(
          event => event.status.toLowerCase() === 'pending' && !event.isFree
        );
        const isKYCIncomplete = !verificationStatus?.kycStatus || verificationStatus.kycStatus !== 'APPROVED';
        const showBanner = (hasApprovedPaidEvents || hasPendingPaidEvents) && isKYCIncomplete;
        return showBanner ? (
          <div className="mb-6">
            <KYCRequiredBanner
              hasApprovedPaidEvents={hasApprovedPaidEvents}
              hasPendingPaidEvents={hasPendingPaidEvents}
              isKYCIncomplete={isKYCIncomplete}
              variant="banner"
              onNavigateToKYC={() => {
                navigate('/user/dashboard?section=settings&tab=verification');
              }}
            />
          </div>
        ) : null;
      })()}

      {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {getGreeting()}, {getFirstName(user.name)}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {upcomingEvents.length > 0
                  ? `You have ${upcomingEvents.length} upcoming ${upcomingEvents.length === 1 ? 'event' : 'events'}`
                  : "Discover events you'll love"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="gap-2 text-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Browse Events
              </Button>
              <Button
                onClick={() => navigate('/user/create-event')}
                className="gap-2 text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"
                aria-label={CTA_LABELS.CREATE_EVENT}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {CTA_LABELS.CREATE_EVENT}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit overflow-x-auto border border-border" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentTab(tab.key)}
                role="tab"
                aria-selected={currentTab === tab.key}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                  currentTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {'icon' in tab && tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                {tab.label}
                {'badge' in tab && tab.badge && (
                  <Badge variant="destructive" className="ml-0.5 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      <div className="min-h-[400px]">

        {/* ── Attending ──────────────────────────────────────────────── */}
        {currentTab === 'attending' && (
          <div role="tabpanel" id="attending-panel">
            {attendingLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="default" />
              </div>
            ) : attendingEvents.length > 0 ? (
              <div>
                <FilterTabs
                  tabs={FILTER_TABS.map(t => ({
                    ...t,
                    count: t.key === 'all' ? attendingEvents.length
                      : t.key === 'upcoming' ? upcomingEvents.length
                      : pastAttendingEvents.length,
                  }))}
                  activeFilter={attendingFilter}
                  onFilterChange={setAttendingFilter}
                />

                {filteredAttendingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAttendingEvents.map((event, index) => (
                      <EventCard
                        key={event.id}
                        id={event.id}
                        slug={event.slug}
                        title={event.title}
                        date={event.date}
                        location={event.location}
                        image={event.image}
                        status={event.status}
                        context="attending"
                        index={index}
                        onViewEvent={(id) => navigate(`/user/event/${id}`)}
                        onShare={handleShare}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title={attendingFilter === 'upcoming' ? 'No Upcoming Events' : 'No Past Events'}
                    description={attendingFilter === 'upcoming'
                      ? 'You have no upcoming events. Browse and register for events.'
                      : 'You have no past events yet.'}
                    action={{ label: 'Browse Events', onClick: () => navigate('/') }}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <EmptyState
                  icon={Calendar}
                  title="No Events Yet"
                  description={EMPTY_STATE_MESSAGES.NO_ATTENDING_EVENTS}
                  action={{ label: 'Browse Events', onClick: () => navigate('/') }}
                />

                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Ready to Create Your Own Event?</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Turn your idea into reality. Create an event, get it approved by our team, and become an organizer.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => navigate('/user/create-event')}
                    className="gap-2 bg-gradient-to-r from-primary to-primary/90"
                  >
                    <Sparkles className="h-4 w-4" />
                    Create Your First Event
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── My Events (Pending) ────────────────────────────────────── */}
        {currentTab === 'my-events' && (
          <div role="tabpanel" id="my-events-panel">
            {organizingLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="default" />
              </div>
            ) : pendingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingEvents.map((event) => (
                  <OrganizingEventCard key={event.id} event={event} context="attendee" />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No pending events"
                description="Events you create will appear here while waiting for approval"
                action={{ label: 'Create an Event', onClick: () => navigate('/user/create-event') }}
              />
            )}
          </div>
        )}

        {/* ── Saved ──────────────────────────────────────────────────── */}
        {currentTab === 'saved' && (
          <div role="tabpanel" id="saved-panel">
            {savedLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="default" />
              </div>
            ) : savedEvents.length > 0 ? (
              <div>
                <FilterTabs
                  tabs={FILTER_TABS.map(t => ({
                    ...t,
                    count: t.key === 'all' ? savedEvents.length
                      : t.key === 'upcoming' ? savedUpcomingCount
                      : savedPastCount,
                  }))}
                  activeFilter={savedFilter}
                  onFilterChange={setSavedFilter}
                />

                {filteredSavedEvents.length > 0 ? (
                  <div className="space-y-3">
                    {filteredSavedEvents.map((event, index) => (
                      <EventCard
                        key={event.id}
                        id={event.id}
                        slug={event.slug}
                        title={event.title}
                        date={event.date}
                        location={event.location}
                        image={event.image}
                        status={deriveStatus(event.date)}
                        context="saved"
                        index={index}
                        onViewEvent={(id) => navigate(`/event/${event.slug ?? id}`)}
                        onShare={handleShare}
                        onUnsave={handleUnsave}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Heart}
                    title={savedFilter === 'upcoming' ? 'No Upcoming Saved Events' : 'No Past Saved Events'}
                    description="Try a different filter or browse more events."
                    action={{ label: 'Browse Events', onClick: () => navigate('/') }}
                  />
                )}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="No Saved Events"
                description={EMPTY_STATE_MESSAGES.NO_SAVED_EVENTS}
                action={{ label: 'Browse Events', onClick: () => navigate('/') }}
              />
            )}
          </div>
        )}

        {/* ── Tickets ────────────────────────────────────────────────── */}
        {currentTab === 'tickets' && (
          <div role="tabpanel" id="tickets-panel">
            <TicketsTabContent />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
