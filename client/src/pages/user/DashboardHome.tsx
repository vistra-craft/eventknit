/**
 * Dashboard Home — Attendee Events Hub
 *
 * Modern layout inspired by Lu.ma / Eventbrite:
 * - Personalized greeting with time-aware message
 * - Featured next event card (hero-style)
 * - Event cards in a responsive grid
 * - Tabs: Attending | Saved | Settings
 */

import { lazy, Suspense, useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Download,
  Share2,
  Heart,
  Settings as SettingsIcon,
  Sparkles,
  ArrowRight,
  Bookmark,
  Timer,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Loader } from '../../components/ui/loader';
import { Badge } from '../../components/ui/badge';
import EmptyState from '../../components/EmptyState';
import { OrganizingEventCard } from '../../components/OrganizingEventCard';
import { KYCRequiredBanner } from '../../components/KYCRequiredBanner';
import { useMyEvents } from '../../hooks/useMyEvents';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import { shareEvent } from '../../lib/utils/share';
import { downloadTicket } from '../../lib/utils/ticket';
import { useToast } from '../../hooks/useToast';
import { showErrorToast } from '../../lib/utils/error';
import { getVerificationStatus, type VerificationStatus } from '../../lib/verification-api';
import {
  TAB_LABELS,
  EMPTY_STATE_MESSAGES,
  CTA_LABELS,
} from '../../constants/navigationLabels';

const SettingsPage = lazy(() => import('./UserSettingsPage'));

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

function formatEventDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatEventDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDaysUntil(dateString: string): number {
  const diff = new Date(dateString).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Component ──────────────────────────────────────────────────────────────────

const DashboardHome = ({ user }: DashboardHomeProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const {
    attendingEvents,
    organizingEvents,
    savedEvents,
    attendingLoading,
    organizingLoading,
    savedLoading,
  } = useMyEvents();

  const [currentTab, setCurrentTab] = useState<'attending' | 'my-events' | 'saved' | 'settings'>('attending');
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

  useEffect(() => {
    if (searchParams.get('view') === 'settings') {
      setCurrentTab('settings');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('view');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (authUser?.role === UserRole.ORGANIZER) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  const pendingEvents = organizingEvents.filter(
    event => event.status.toLowerCase() === 'pending'
  );

  // Split attending events into upcoming and past
  const upcomingEvents = attendingEvents.filter(e => e.status === 'upcoming');
  const pastEvents = attendingEvents.filter(e => e.status !== 'upcoming');

  // The next event to attend (first upcoming)
  const nextEvent = upcomingEvents[0];
  // Remaining upcoming events (skip the featured one)
  const remainingUpcoming = upcomingEvents.slice(1);

  const handleShare = async (event: { title: string; id: string; slug?: string | null }) => {
    const shared = await shareEvent(event.title, event.slug ?? event.id);
    toast({
      title: shared ? 'Shared' : 'Link Copied',
      description: shared ? 'Event shared' : 'Link copied to clipboard',
    });
  };

  const handleDownload = (event: { id: string; title: string; date: string; location: string; type: string }) => {
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
      toast({ title: 'Downloaded', description: 'Ticket downloaded' });
    } catch (err) {
      showErrorToast(toast, err, 'Download failed');
    }
  };

  // Tabs
  const tabs = [
    { key: 'attending' as const, label: TAB_LABELS.ATTENDING },
    ...(pendingEvents.length > 0 ? [
      { key: 'my-events' as const, label: 'My Events', badge: pendingEvents.length }
    ] : []),
    { key: 'saved' as const, label: TAB_LABELS.SAVED, icon: Bookmark },
    { key: 'settings' as const, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
      {/* KYC Banner */}
      {currentTab !== 'settings' && (() => {
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
                setCurrentTab('settings');
                setSearchParams({ tab: 'verification' }, { replace: true });
              }}
            />
          </div>
        ) : null;
      })()}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      {currentTab !== 'settings' && (
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
      )}

      {/* Settings header */}
      {currentTab === 'settings' && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
        </div>
      )}

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
              <div className="space-y-8">
                {/* Featured Next Event */}
                {nextEvent && (
                  <div
                    onClick={() => navigate(`/user/event/${nextEvent.id}`)}
                    className="relative rounded-2xl overflow-hidden border border-border/40 bg-card cursor-pointer group transition-all duration-300 hover:shadow-lg hover:border-primary/20"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="sm:w-72 lg:w-96 flex-shrink-0">
                        <img
                          src={nextEvent.image}
                          alt={nextEvent.title}
                          className="w-full h-48 sm:h-full object-cover"
                        />
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-primary/10 text-primary border-0 text-xs font-semibold">
                              Next Up
                            </Badge>
                            {getDaysUntil(nextEvent.date) <= 7 && (
                              <Badge className="bg-success/10 text-success border-0 text-xs">
                                <Timer className="w-3 h-3 mr-1" />
                                {getDaysUntil(nextEvent.date) === 0
                                  ? 'Today'
                                  : getDaysUntil(nextEvent.date) === 1
                                    ? 'Tomorrow'
                                    : `In ${getDaysUntil(nextEvent.date)} days`
                                }
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-3">
                            {nextEvent.title}
                          </h2>
                          <div className="space-y-1.5">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                              {formatEventDateLong(nextEvent.date)}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                              {nextEvent.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={(e) => { e.stopPropagation(); navigate(`/user/event/${nextEvent.id}`); }}
                          >
                            View Event
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDownload(nextEvent); }}
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Ticket
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); handleShare(nextEvent); }}
                            title="Share event"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Remaining Upcoming Events */}
                {remainingUpcoming.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Upcoming ({remainingUpcoming.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {remainingUpcoming.map((event, index) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          index={index}
                          onNavigate={() => navigate(`/user/event/${event.id}`)}
                          onDownload={() => handleDownload(event)}
                          onShare={() => handleShare(event)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Events */}
                {pastEvents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Past ({pastEvents.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pastEvents.map((event, index) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          index={index}
                          isPast
                          onNavigate={() => navigate(`/user/event/${event.id}`)}
                          onDownload={() => handleDownload(event)}
                          onShare={() => handleShare(event)}
                        />
                      ))}
                    </div>
                  </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedEvents.map((event, index) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/event/${event.slug ?? event.id}`)}
                    className="flex items-center gap-4 p-4 bg-card border border-border/40 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer group animate-in fade-in-0 slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 40}ms` }}
                    role="article"
                  >
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate mb-1">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {formatEventDate(event.date)}
                        <span className="mx-0.5 opacity-30">·</span>
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </p>
                    </div>
                    <Heart className="w-4 h-4 fill-current text-destructive flex-shrink-0 opacity-60" />
                  </div>
                ))}
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

        {/* ── Settings ───────────────────────────────────────────────── */}
        {currentTab === 'settings' && (
          <div role="tabpanel" id="settings-panel">
            <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader size="default" /></div>}>
              <SettingsPage />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Event Card Component ───────────────────────────────────────────────────────

interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    type: string;
    image: string;
    status?: string;
  };
  index: number;
  isPast?: boolean;
  onNavigate: () => void;
  onDownload: () => void;
  onShare: () => void;
}

function EventCard({ event, index, isPast, onNavigate, onDownload, onShare }: EventCardProps) {
  return (
    <div
      onClick={onNavigate}
      className={`flex items-center gap-4 p-4 bg-card border border-border/40 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer group animate-in fade-in-0 slide-in-from-bottom-2 ${
        isPast ? 'opacity-75' : ''
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
      role="article"
    >
      <img
        src={event.image}
        alt={event.title}
        className={`w-16 h-16 rounded-lg object-cover flex-shrink-0 ${isPast ? 'grayscale-[30%]' : ''}`}
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {event.title}
          </h3>
          {!isPast && getDaysUntil(event.date) <= 3 && (
            <Badge className="bg-success/10 text-success border-0 text-[10px] px-1.5 py-0 flex-shrink-0">
              {getDaysUntil(event.date) === 0 ? 'Today' : getDaysUntil(event.date) === 1 ? 'Tomorrow' : `${getDaysUntil(event.date)}d`}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          {formatEventDate(event.date)}
          <span className="mx-0.5 opacity-30">·</span>
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{event.location}</span>
        </p>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          title="Download ticket"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          title="Share event"
        >
          <Share2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default DashboardHome;
