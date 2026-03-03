/**
 * Dashboard Home - Unified My Events Hub
 * Three tabs: Attending, Organizing, Saved
 * Displays all events in a unified interface
 */

import { lazy, Suspense, useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Calendar, MapPin, Download, Share2, Heart, Settings as SettingsIcon, Sparkles } from 'lucide-react';
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
import { getVerificationStatus, type VerificationStatus } from '../../lib/verification-api';
import {
  PAGE_TITLES,
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

const DashboardHome = ({ user }: DashboardHomeProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  // All hooks must be called unconditionally before any early return
  const {
    attendingEvents,
    organizingEvents,
    savedEvents,
    attendingLoading,
    organizingLoading,
    savedLoading,
  } = useMyEvents();

  const [currentTab, setCurrentTab] = useState<'attending' | 'my-events' | 'saved' | 'settings'>('attending');

  // Load verification status
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);

  useEffect(() => {
    const loadVerification = async () => {
      try {
        const res = await getVerificationStatus();
        if (res.success) {
          setVerificationStatus(res.data);
        }
      } catch (err) {
        console.error('Failed to load verification status:', err);
      }
    };
    loadVerification();
  }, []);

  // Handle URL query parameter for settings view
  useEffect(() => {
    if (searchParams.get('view') === 'settings') {
      setCurrentTab('settings');
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('view');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Only ATTENDEE role can access this dashboard
  // ORGANIZER role should be redirected to /organizer/dashboard
  if (authUser?.role === UserRole.ORGANIZER) {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  // Filter pending events for attendees (events awaiting approval)
  const pendingEvents = organizingEvents.filter(
    event => event.status.toLowerCase() === 'pending'
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleShare = async (event: { title: string; id: string }) => {
    const shared = await shareEvent(event.title, event.id);
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
    } catch {
      toast({ title: 'Error', description: 'Failed to download', variant: 'destructive' });
    }
  };

  // Tabs configuration - ATTENDEE ONLY
  const tabs = [
    { key: 'attending' as const, label: TAB_LABELS.ATTENDING },
    // Show "My Events" tab if user has pending events
    ...(pendingEvents.length > 0 ? [
      { key: 'my-events' as const, label: 'My Events', badge: pendingEvents.length }
    ] : []),
    { key: 'saved' as const, label: TAB_LABELS.SAVED },
    { key: 'settings' as const, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      {/* KYC Required Banner */}
      {currentTab !== 'settings' && (
        <>
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
              <>
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
                <div className="mb-6" />
              </>
            ) : null;
          })()}
        </>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-page-title mb-1">
              {currentTab === 'settings' ? 'Settings' : PAGE_TITLES.MY_EVENTS}
            </h1>
            <p className="text-page-subtitle">
              {currentTab === 'attending' && "Events you're attending"}
              {currentTab === 'saved' && "Events you've saved"}
              {currentTab === 'settings' && "Manage your account settings"}
            </p>
          </div>
          {currentTab !== 'settings' && (
            <Button
              onClick={() => navigate('/user/create-event')}
              size="default"
              className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"
              aria-label={CTA_LABELS.CREATE_EVENT}
            >
              <Sparkles className="h-4 w-4" />
              {CTA_LABELS.CREATE_EVENT}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-full sm:w-auto overflow-x-auto border border-border" role="tablist" aria-label="Event categories">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              role="tab"
              aria-selected={currentTab === tab.key}
              aria-controls={`${tab.key}-panel`}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                currentTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
              {'badge' in tab && tab.badge && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs">
                  {tab.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Attending Tab */}
        {currentTab === 'attending' && (
          <div role="tabpanel" id="attending-panel" aria-labelledby="attending-tab">
            {attendingLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="default" />
              </div>
            ) : attendingEvents.length > 0 ? (
              <div className="space-y-3 max-w-3xl">
                {attendingEvents.map((event, index) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/user/event/${event.id}`)}
                    className="flex gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group animate-in fade-in-0 slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                    role="article"
                    aria-label={`Event: ${event.title}`}
                  >
                    <img
                      src={event.image}
                      alt={`Cover image for ${event.title}`}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {event.title}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={`text-xs flex-shrink-0 ${
                            event.status === 'upcoming'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
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
                          className="h-7 px-2 text-xs hover:scale-105 active:scale-95 transition-transform duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(event);
                          }}
                          aria-label={`Download ticket for ${event.title}`}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs hover:scale-105 active:scale-95 transition-transform duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(event);
                          }}
                          aria-label={`Share ${event.title}`}
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
              <div className="space-y-6">
                <EmptyState
                  icon={Calendar}
                  title="No Events Yet"
                  description={EMPTY_STATE_MESSAGES.NO_ATTENDING_EVENTS}
                  action={{ label: 'Browse Events', onClick: () => navigate('/') }}
                />
                
                {/* Hero CTA for creating events */}
                <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Ready to Create Your Own Event?</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Turn your idea into reality. Create an event, get it approved by our team, and become an organizer with full dashboard access.
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

        {/* My Events (Pending) Tab */}
        {currentTab === 'my-events' && (
          <div role="tabpanel" id="my-events-panel" aria-labelledby="my-events-tab" className="mt-6">
            {organizingLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="default" aria-label="Loading your events" />
              </div>
            ) : pendingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingEvents.map((event) => (
                  <OrganizingEventCard
                    key={event.id}
                    event={event}
                  />
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

        {/* Saved Tab */}
        {currentTab === 'saved' && (
          <div role="tabpanel" id="saved-panel" aria-labelledby="saved-tab">
            {savedLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="default" aria-label="Loading saved events" />
              </div>
            ) : savedEvents.length > 0 ? (
              <div className="space-y-3 max-w-3xl">
                {savedEvents.map((event, index) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="flex gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group animate-in fade-in-0 slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                    role="article"
                    aria-label={`Saved event: ${event.title}`}
                  >
                    <img
                      src={event.image}
                      alt={`Cover image for ${event.title}`}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {event.title}
                      </h3>
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
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Heart className="w-3.5 h-3.5 mr-1 fill-current text-destructive" />
                          Saved
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
                description={EMPTY_STATE_MESSAGES.NO_SAVED_EVENTS}
                action={{ label: 'Browse Events', onClick: () => navigate('/') }}
              />
            )}
          </div>
        )}

        {/* Settings Tab */}
        {currentTab === 'settings' && (
          <div role="tabpanel" id="settings-panel" aria-labelledby="settings-tab">
            <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader size="default" /></div>}>
              <SettingsPage />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
