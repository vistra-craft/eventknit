/**
 * Organizing Event Card Component
 * Displays event with organizer metrics and quick actions
 * Optimized with React.memo for better performance
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, CheckCircle, DollarSign, BarChart3, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { RichTextContent } from './ui/RichTextContent';
import { Loader } from './ui/loader';
import { getEventById } from '../lib/event-api';
import type { OrganizingEvent } from '../hooks/useMyEvents';
import type { EventData } from '../types/event';


interface OrganizingEventCardProps {
  event: OrganizingEvent;
  onManage?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
}

const OrganizingEventCardComponent = ({ event, onManage, onDelete }: OrganizingEventCardProps) => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<EventData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'published' || statusLower === 'upcoming' || statusLower === 'approved') return 'default';
    if (statusLower === 'draft') return 'secondary';
    if (statusLower === 'completed' || statusLower === 'past') return 'outline';
    if (statusLower === 'cancelled' || statusLower === 'rejected') return 'destructive';
    if (statusLower === 'pending') return 'secondary';
    return 'default';
  };

  const handleManageClick = () => {
    if (onManage) {
      onManage(event.id);
    } else {
      navigate(`/organizer/event/${event.id}`);
    }
  };

  const handleEditClick = () => {
    navigate(`/user/create-event-form?edit=${event.id}`);
  };

  const handlePreviewClick = () => {
    setIsPreviewOpen(true);
  };

  useEffect(() => {
    if (!isPreviewOpen) return;

    let isActive = true;
    const loadPreview = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        const response = await getEventById(event.id);
        if (!isActive) return;
        if (response.success && response.data?.event) {
          setPreviewEvent(response.data.event);
        } else {
          setPreviewEvent(null);
          setPreviewError('Unable to load event details.');
        }
      } catch (error) {
        if (!isActive) return;
        setPreviewEvent(null);
        setPreviewError('Unable to load event details.');
      } finally {
        if (isActive) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isActive = false;
    };
  }, [event.id, isPreviewOpen]);

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(event.id);
    }
  };

  // Check if event is pending approval
  const isPending = event.status.toLowerCase() === 'pending';

  const attendancePercentage = event.capacity > 0
    ? Math.round((event.ticketsSold || event.attendees) / event.capacity * 100)
    : 0;

  const checkinPercentage = event.ticketsSold || event.attendees > 0
    ? Math.round((event.checkedIn || 0) / (event.ticketsSold || event.attendees) * 100)
    : 0;

  const previewDescription = useMemo(() => {
    if (previewEvent?.fullDescription) return previewEvent.fullDescription;
    if (previewEvent?.description) return previewEvent.description;
    return event.description || '';
  }, [event.description, previewEvent?.description, previewEvent?.fullDescription]);

  const previewTitle = previewEvent?.title || event.title;
  const previewImage = previewEvent?.image || event.image;
  const previewCategory = previewEvent?.category || event.category;
  const previewVenue = previewEvent?.venue || event.venue || event.location;
  const previewLocation = previewEvent?.location || event.location;
  const previewStartDate = previewEvent?.startDate || event.date;
  const previewStartTime = previewEvent?.startTime || event.time;
  const previewEndDate = previewEvent?.endDate || null;
  const previewEndTime = previewEvent?.endTime || null;

  return (
    <>
      <Card
        variant="interactive"
        className="group overflow-hidden bg-card-surface rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
        role="article"
        aria-label={`Event: ${event.title}`}
      >
        {/* Event Image */}
        <div className="relative overflow-hidden h-48">
          <img
            src={event.image}
            alt={`Cover image for ${event.title}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-3 right-3">
            <Badge variant={getStatusColor(event.status)}>
              {event.status}
            </Badge>
          </div>
        </div>

        <CardContent className="pt-4 pb-4 px-4">
        {/* Event Title & Category */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 leading-tight mb-1">
            {event.title}
          </h3>
          {event.category && (
            <span className="text-xs text-muted-foreground">{event.category}</span>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="line-clamp-1">{formatDate(event.date)}</span>
            {event.time && <span className="ml-1">• {event.time}</span>}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="line-clamp-1">{event.venue || event.location}</span>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-t border-border">
          {/* Tickets Sold */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <Users className="h-3 w-3" />
              <span>Sold</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {event.ticketsSold || event.attendees}/{event.capacity || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {attendancePercentage}%
            </div>
          </div>

          {/* Checked In */}
          <div className="flex flex-col items-center border-l border-r border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <CheckCircle className="h-3 w-3" />
              <span>Checked In</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {event.checkedIn || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {checkinPercentage}%
            </div>
          </div>

          {/* Revenue */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <DollarSign className="h-3 w-3" />
              <span>Revenue</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {formatCurrency(event.revenue || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {event.views || 0} views
            </div>
          </div>
        </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {isPending ? (
              // Actions for pending events: Edit, Preview, Delete
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEditClick}
                  className="flex-1 hover:scale-105 active:scale-95 transition-transform duration-200 gap-1.5"
                  aria-label={`Edit ${event.title}`}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Event
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewClick}
                  className="px-3 hover:scale-105 active:scale-95 transition-transform duration-200"
                  aria-label={`Preview ${event.title}`}
                  title="See how your event will look once approved"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="px-3 hover:scale-105 active:scale-95 transition-transform duration-200 text-destructive hover:text-destructive"
                  aria-label={`Delete ${event.title}`}
                  title="Delete this event"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              // Actions for approved events: Manage, Analytics, More
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleManageClick}
                  className="flex-1 hover:scale-105 active:scale-95 transition-transform duration-200"
                  aria-label={`Manage ${event.title}`}
                >
                  Manage Event
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/organizer/event/${event.id}?tab=analytics`)}
                  className="px-2 hover:scale-105 active:scale-95 transition-transform duration-200"
                  aria-label={`View analytics for ${event.title}`}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 hover:scale-105 active:scale-95 transition-transform duration-200"
                  aria-label={`More options for ${event.title}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex-row items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle>Event Preview</DialogTitle>
              <DialogDescription>
                This is how your event will look once approved.
              </DialogDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setIsPreviewOpen(false); handleEditClick(); }}
              className="shrink-0 gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Event
            </Button>
          </DialogHeader>

          <div className="space-y-6">
            {previewLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader size="lg" className="text-primary" />
              </div>
            ) : previewError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {previewError}
              </div>
            ) : (
              <>
                {previewImage && (
                  <div className="relative overflow-hidden rounded-xl h-64">
                    <img
                      src={previewImage}
                      alt={`Cover image for ${previewTitle}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant={getStatusColor(previewEvent?.status || event.status)}>
                        {previewEvent?.status || event.status}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">{previewTitle}</h3>
                  {previewCategory && (
                    <p className="text-sm text-muted-foreground">{previewCategory}</p>
                  )}
                  {(previewEvent?.organizerName || previewEvent?.organizer?.organizationName) && (
                    <p className="text-sm text-muted-foreground">
                      by {previewEvent?.organizerName || previewEvent?.organizer?.organizationName}
                    </p>
                  )}
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground">
                  {(previewStartDate || previewStartTime) && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5" />
                      <div>
                        {previewStartDate && (
                          <span>
                            {formatDate(previewStartDate)}
                            {previewStartTime ? ` • ${previewStartTime}` : ''}
                          </span>
                        )}
                        {(previewEndDate || previewEndTime) && (
                          <div className="text-xs text-muted-foreground">
                            Ends {previewEndDate ? formatDate(previewEndDate) : ''}{previewEndTime ? ` • ${previewEndTime}` : ''}
                          </div>
                        )}
                        {previewEvent?.timezone && (
                          <div className="text-xs text-muted-foreground">{previewEvent.timezone}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {(previewVenue || previewLocation || previewEvent?.onlineLink) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <div>
                        {previewVenue && <div>{previewVenue}</div>}
                        {previewLocation && <div className="text-xs text-muted-foreground">{previewLocation}</div>}
                        {previewEvent?.onlineLink && (
                          <a href={previewEvent.onlineLink} className="text-primary hover:underline text-xs">
                            {previewEvent.onlineLink}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {(previewEvent?.capacity || event.capacity) && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Capacity: {previewEvent?.capacity || event.capacity}</span>
                    </div>
                  )}
                  {previewEvent?.registrationDeadline && (
                    <div className="text-xs text-muted-foreground">
                      Registration closes on {formatDate(previewEvent.registrationDeadline)}
                    </div>
                  )}
                </div>

                {previewDescription && (
                  <div className="space-y-2">
                    <h4 className="text-section-header">About this event</h4>
                    <RichTextContent content={previewDescription} className="text-foreground/90" />
                  </div>
                )}

                {previewEvent?.ticketTypes && previewEvent.ticketTypes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Tickets</h4>
                    <div className="space-y-2">
                      {previewEvent.ticketTypes.map((ticket, index) => (
                        <div key={`${ticket.name}-${index}`} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <p className="font-medium">{ticket.name || `Ticket ${index + 1}`}</p>
                            {ticket.quantity ? (
                              <p className="text-xs text-muted-foreground">{ticket.quantity} available</p>
                            ) : null}
                            {ticket.features && ticket.features.length > 0 && (
                              <p className="text-xs text-muted-foreground">{ticket.features.join(' • ')}</p>
                            )}
                          </div>
                          <span className="font-semibold">
                            {ticket.price === 0 || previewEvent?.isFree
                              ? 'Free'
                              : `${previewEvent?.currency || 'USD'} ${ticket.price.toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewEvent?.requirements && previewEvent.requirements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-section-header">Requirements</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {previewEvent.requirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {previewEvent?.agenda && previewEvent.agenda.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Agenda</h4>
                    <div className="space-y-2">
                      {previewEvent.agenda.map((item, index) => (
                        <div key={`${item.title}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{item.title}</div>
                          {(item.startTime || item.endTime) && (
                            <div className="text-xs text-muted-foreground">
                              {item.startTime || ''}{item.endTime ? ` - ${item.endTime}` : ''}
                            </div>
                          )}
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewEvent?.speakers && previewEvent.speakers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Speakers</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {previewEvent.speakers.map((speaker, index) => (
                        <div key={`${speaker.name}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{speaker.name}</div>
                          {speaker.title && <div className="text-xs text-muted-foreground">{speaker.title}</div>}
                          {speaker.bio && <div className="text-xs text-muted-foreground mt-1">{speaker.bio}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewEvent?.sponsors && previewEvent.sponsors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Sponsors</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {previewEvent.sponsors.map((sponsor, index) => (
                        <div key={`${sponsor.name}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{sponsor.name}</div>
                          {sponsor.level && <div className="text-xs text-muted-foreground">{sponsor.level}</div>}
                          {sponsor.description && <div className="text-xs text-muted-foreground mt-1">{sponsor.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewEvent?.exhibitors && previewEvent.exhibitors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Exhibitors</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {previewEvent.exhibitors.map((exhibitor, index) => (
                        <div key={`${exhibitor.name}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{exhibitor.name}</div>
                          {exhibitor.booth && <div className="text-xs text-muted-foreground">Booth {exhibitor.booth}</div>}
                          {exhibitor.description && <div className="text-xs text-muted-foreground mt-1">{exhibitor.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewEvent?.faqs && previewEvent.faqs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">FAQs</h4>
                    <div className="space-y-2">
                      {previewEvent.faqs.map((faq, index) => (
                        <div key={`${faq.question}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{faq.question}</div>
                          <div className="text-xs text-muted-foreground mt-1">{faq.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewEvent?.tags && previewEvent.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewEvent.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
// Will only re-render if event or onManage props change
export const OrganizingEventCard = memo(OrganizingEventCardComponent);
