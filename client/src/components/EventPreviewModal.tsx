/**
 * Event Preview Modal Component
 * Comprehensive modal showing all event details
 * Used in admin dashboard, organizer dashboard, and attendee dashboard
 */

import { useMemo } from 'react';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { RichTextContent } from './ui/RichTextContent';
import { Loader } from './ui/loader';
import type { EventData } from '../types/event';

interface EventPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventData | null;
  loading?: boolean;
  error?: string | null;
}

const getStatusColor = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower === 'published' || statusLower === 'upcoming' || statusLower === 'approved') return 'default';
  if (statusLower === 'draft') return 'secondary';
  if (statusLower === 'completed' || statusLower === 'past') return 'outline';
  if (statusLower === 'cancelled' || statusLower === 'rejected') return 'destructive';
  if (statusLower === 'pending') return 'secondary';
  return 'default';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

export const EventPreviewModal = ({
  isOpen,
  onOpenChange,
  event,
  loading = false,
  error = null,
}: EventPreviewModalProps) => {

  const displayDescription = useMemo(() => {
    if (!event) return '';
    return event.fullDescription || event.description || '';
  }, [event]);

  const displayTitle = event?.title || '';
  const displayImage = event?.image || '';
  const displayCategory = event?.category || '';
  const displayVenue = event?.venue || event?.location || '';
  const displayLocation = event?.location || '';
  const displayStartDate = event?.startDate || '';
  const displayStartTime = event?.startTime || '';
  const displayEndDate = event?.endDate || null;
  const displayEndTime = event?.endTime || null;
  const displayCapacity = event?.capacity || 0;
  const displayTicketsSold = 0;
  const displayPrice = event?.price ? parseFloat(event.price.toString()) : 0;
  const displayIsFree = event?.isFree || false;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-row items-start justify-between gap-4 pr-8">
          <div>
            <DialogTitle>Event Preview</DialogTitle>
            <DialogDescription>
              Complete event details and information
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader size="lg" className="text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : event ? (
            <>
              {/* Event Image */}
              {displayImage && (
                <div className="relative overflow-hidden rounded-xl h-64">
                  <img
                    src={displayImage}
                    alt={`Cover image for ${displayTitle}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {event.status && (
                    <div className="absolute top-3 right-3">
                      <Badge variant={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Title and Category */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {displayTitle}
                </h2>
                {displayCategory && (
                  <Badge className="mb-2">{displayCategory}</Badge>
                )}
              </div>

              {/* Description */}
              {displayDescription && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    About this event
                  </h3>
                  <RichTextContent
                    content={displayDescription}
                    className="text-sm text-muted-foreground"
                  />
                </div>
              )}

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date and Time */}
                {displayStartDate && (
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Start Date & Time</p>
                      <p className="font-medium text-sm">
                        {formatDate(displayStartDate)}
                        {displayStartTime && ` at ${displayStartTime}`}
                      </p>
                    </div>
                  </div>
                )}

                {displayEndDate && (
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">End Date & Time</p>
                      <p className="font-medium text-sm">
                        {formatDate(displayEndDate)}
                        {displayEndTime && ` at ${displayEndTime}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {displayVenue && (
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Venue</p>
                      <p className="font-medium text-sm">{displayVenue}</p>
                    </div>
                  </div>
                )}

                {displayLocation && displayLocation !== displayVenue && (
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="font-medium text-sm">{displayLocation}</p>
                    </div>
                  </div>
                )}

                {/* Capacity */}
                {displayCapacity > 0 && (
                  <div className="flex gap-3">
                    <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                      <p className="font-medium text-sm">
                        {displayTicketsSold}/{displayCapacity} attendees
                      </p>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="flex gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Price</p>
                    <p className="font-medium text-sm">
                      {displayIsFree ? 'Free' : formatCurrency(displayPrice)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket Types */}
              {event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Ticket Types
                  </h3>
                  <div className="space-y-2">
                    {event.ticketTypes.map((ticket, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{ticket.name}</p>
                          {ticket.discountLabel && (
                            <p className="text-xs text-muted-foreground">{ticket.discountLabel}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {ticket.price === 0 ? 'Free' : formatCurrency(Number(ticket.price))}
                          </p>
                          {ticket.quantity && (
                            <p className="text-xs text-muted-foreground">
                              {ticket.quantity} available
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {event.requirements && Array.isArray(event.requirements) && event.requirements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Requirements
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {(event.requirements as string[]).map((req: string, idx: number) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agenda */}
              {event.agenda && Array.isArray(event.agenda) && event.agenda.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Agenda
                  </h3>
                  <div className="space-y-2">
                    {event.agenda.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-border p-3">
                        <p className="font-medium text-sm">{item.title}</p>
                        {(item.startTime || item.endTime) && (
                          <p className="text-xs text-muted-foreground">
                            {item.startTime || ''}{item.endTime ? ` - ${item.endTime}` : ''}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speakers */}
              {event.speakers && Array.isArray(event.speakers) && event.speakers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Speakers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {event.speakers.map((speaker, idx) => (
                      <div key={idx} className="rounded-lg border border-border p-3">
                        {speaker.image && (
                          <div className="mb-3 overflow-hidden rounded-lg h-32">
                            <img
                              src={speaker.image}
                              alt={speaker.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <p className="font-medium text-sm">{speaker.name}</p>
                        {speaker.title && (
                          <p className="text-xs text-muted-foreground">{speaker.title}</p>
                        )}
                        {speaker.bio && (
                          <p className="text-xs text-muted-foreground mt-1">{speaker.bio}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsors */}
              {event.sponsors && Array.isArray(event.sponsors) && event.sponsors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Sponsors
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {event.sponsors.map((sponsor, idx) => (
                      <div key={idx} className="rounded-lg border border-border p-3">
                        {sponsor.logo && (
                          <div className="mb-3 overflow-hidden rounded-lg h-24 bg-muted flex items-center justify-center">
                            <img
                              src={sponsor.logo}
                              alt={sponsor.name}
                              className="w-full h-full object-contain p-2"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <p className="font-medium text-sm">{sponsor.name}</p>
                        {sponsor.level && (
                          <p className="text-xs text-muted-foreground">{sponsor.level}</p>
                        )}
                        {sponsor.description && (
                          <p className="text-xs text-muted-foreground mt-1">{sponsor.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exhibitors */}
              {event.exhibitors && Array.isArray(event.exhibitors) && event.exhibitors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Exhibitors
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {event.exhibitors.map((exhibitor, idx) => (
                      <div key={idx} className="rounded-lg border border-border p-3">
                        {exhibitor.logo && (
                          <div className="mb-3 overflow-hidden rounded-lg h-24 bg-muted flex items-center justify-center">
                            <img
                              src={exhibitor.logo}
                              alt={exhibitor.name}
                              className="w-full h-full object-contain p-2"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <p className="font-medium text-sm">{exhibitor.name}</p>
                        {exhibitor.booth && (
                          <p className="text-xs text-muted-foreground">Booth {exhibitor.booth}</p>
                        )}
                        {exhibitor.description && (
                          <p className="text-xs text-muted-foreground mt-1">{exhibitor.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {event.faqs && Array.isArray(event.faqs) && event.faqs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    FAQs
                  </h3>
                  <div className="space-y-2">
                    {event.faqs.map((faq, idx) => (
                      <div key={idx} className="rounded-lg border border-border p-3">
                        <p className="font-medium text-sm">{faq.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {event.tags && Array.isArray(event.tags) && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(event.tags as string[]).map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Organizer Info */}
              {event.organizer && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Event Organizer
                  </h3>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">
                      {event.organizer.firstName || ''} {event.organizer.lastName || ''}
                    </p>
                    {event.organizer.organizationName && (
                      <p className="text-xs text-muted-foreground">
                        {event.organizer.organizationName}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
