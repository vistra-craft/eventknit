/**
 * Dashboard Home - Unified My Events Hub
 * Three tabs: Attending, Organizing, Saved
 * Displays all events in a unified interface
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Download, Share2, Plus, Heart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Loader } from '../../components/ui/loader';
import { Badge } from '../../components/ui/badge';
import EmptyState from '../../components/EmptyState';
import { OrganizingEventCard } from '../../components/OrganizingEventCard';
import { OrganizerQuickActions } from '../../components/OrganizerQuickActions';
import { useMyEvents } from '../../hooks/useMyEvents';
import { shareEvent } from '../../lib/utils/share';
import { downloadTicket } from '../../lib/utils/ticket';
import { useToast } from '../../hooks/useToast';
import {
  PAGE_TITLES,
  TAB_LABELS,
  EMPTY_STATE_MESSAGES,
  CTA_LABELS,
} from '../../constants/navigationLabels';

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
  const { toast } = useToast();
  const {
    attendingEvents,
    organizingEvents,
    savedEvents,
    attendingLoading,
    organizingLoading,
    savedLoading,
    activeTab,
    setActiveTab,
    canOrganize,
  } = useMyEvents();

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

  // Tabs configuration
  const tabs = [
    { key: 'attending' as const, label: TAB_LABELS.ATTENDING },
    ...(canOrganize ? [{ key: 'organizing' as const, label: TAB_LABELS.ORGANIZING }] : []),
    { key: 'saved' as const, label: TAB_LABELS.SAVED },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{PAGE_TITLES.MY_EVENTS}</h1>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-full sm:w-auto overflow-x-auto" role="tablist" aria-label="Event categories">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`${tab.key}-panel`}
              className={`flex-1 sm:flex-none px-4 sm:px-3 py-2 sm:py-1.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:scale-102'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Organizer Quick Actions */}
      {canOrganize && (
        <div className="mb-6">
          <OrganizerQuickActions />
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Attending Tab */}
        {activeTab === 'attending' && (
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
              <EmptyState
                icon={Calendar}
                title="No Events Yet"
                description={EMPTY_STATE_MESSAGES.NO_ATTENDING_EVENTS}
                action={{ label: 'Browse Events', onClick: () => navigate('/') }}
              />
            )}
          </div>
        )}

        {/* Organizing Tab */}
        {activeTab === 'organizing' && (
          <div role="tabpanel" id="organizing-panel" aria-labelledby="organizing-tab">
            {organizingLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="default" aria-label="Loading organizing events" />
              </div>
            ) : organizingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizingEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="animate-in fade-in-0 zoom-in-95"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <OrganizingEventCard event={event} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Plus}
                title="No Events Yet"
                description={EMPTY_STATE_MESSAGES.NO_ORGANIZING_EVENTS}
                action={{
                  label: CTA_LABELS.CREATE_FIRST_EVENT,
                  onClick: () => navigate('/user/create-event'),
                }}
              />
            )}
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && (
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
      </div>
    </div>
  );
};

export default DashboardHome;
