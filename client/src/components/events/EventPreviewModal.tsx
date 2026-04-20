/**
 * Event Preview Modal Component
 * Comprehensive modal showing all event details
 * Used in admin dashboard, organizer dashboard, and attendee dashboard
 */

import { useMemo } from 'react';
import { Calendar, MapPin, Users, DollarSign, Globe, Clock, Lock, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { Loader } from '@/components/ui/loader';
import { SpeakersShowcase } from '../event-details/SpeakersShowcase';
import { SponsorsShowcase } from '../event-details/SponsorsShowcase';
import { ExhibitorsGrid } from '../event-details/ExhibitorsGrid';
import type { EventData } from '@/types/event';
import { stripHtml } from '@/lib/utils';

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

const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
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
  const displayTicketsSold = event?.registrationCount || 0;
  const displayPrice = event?.price ? parseFloat(event.price.toString()) : 0;
  const displayIsFree = event?.isFree || false;
  const displayCurrency = event?.currency || 'USD';
  const displayAddress = event?.address || '';
  const displayOnlineLink = event?.onlineLink || '';
  const displayRegistrationDeadline = event?.registrationDeadline || null;
  const displayRefundPolicy = event?.refundPolicy || null;
  const displayRefundPolicyText = event?.refundPolicyText || null;
  const displayRefundDeadlineDays = event?.refundDeadlineDays || null;
  const displayIsPrivate = event?.type === 'PRIVATE';
  const displayIsOnline = event?.isOnline || false;
  const displayAgeRestriction = event?.ageRestriction || null;


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
                <div className="flex flex-wrap gap-2 mb-2">
                  {displayCategory && <Badge>{displayCategory}</Badge>}
                  {displayIsPrivate && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  )}
                  {displayIsOnline && (
                    <Badge variant="outline" className="gap-1">
                      <Globe className="h-3 w-3" />
                      Online
                    </Badge>
                  )}
                  {displayAgeRestriction && (
                    <Badge variant="outline">{displayAgeRestriction}</Badge>
                  )}
                </div>
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

                {displayAddress && displayAddress !== displayLocation && (
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <p className="font-medium text-sm">{displayAddress}</p>
                    </div>
                  </div>
                )}

                {displayOnlineLink && (
                  <div className="flex gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Online Link</p>
                      <a
                        href={displayOnlineLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-primary hover:underline break-all"
                      >
                        {displayOnlineLink}
                      </a>
                    </div>
                  </div>
                )}

                {displayRegistrationDeadline && (
                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Registration Deadline</p>
                      <p className="font-medium text-sm">{formatDate(displayRegistrationDeadline)}</p>
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
                      {displayIsFree ? 'Free' : formatCurrency(displayPrice, displayCurrency)}
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
                      <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{ticket.name}</p>
                            {ticket.discountLabel && (
                              <p className="text-xs text-muted-foreground">{ticket.discountLabel}</p>
                            )}
                            {ticket.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{stripHtml(ticket.description)}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              {ticket.price === 0 ? 'Free' : formatCurrency(Number(ticket.price), displayCurrency)}
                            </p>
                            {ticket.quantity && (
                              <p className="text-xs text-muted-foreground">
                                {ticket.quantity} available
                              </p>
                            )}
                          </div>
                        </div>
                        {(ticket.availableFrom || ticket.availableUntil) && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {ticket.availableFrom && `From ${formatDate(ticket.availableFrom)}`}
                            {ticket.availableFrom && ticket.availableUntil && ' '}
                            {ticket.availableUntil && `until ${formatDate(ticket.availableUntil)}`}
                          </p>
                        )}
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
                    {event.requirements.map((req, idx) => (
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
                          <p className="text-xs text-muted-foreground mt-1">{stripHtml(item.description)}</p>
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
                  <SpeakersShowcase speakers={event.speakers} />
                </div>
              )}

              {/* Sponsors */}
              {event.sponsors && Array.isArray(event.sponsors) && event.sponsors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Sponsors
                  </h3>
                  <SponsorsShowcase sponsors={event.sponsors} />
                </div>
              )}

              {/* Exhibitors */}
              {event.exhibitors && Array.isArray(event.exhibitors) && event.exhibitors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Exhibitors
                  </h3>
                  <ExhibitorsGrid exhibitors={event.exhibitors} />
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
                  {event.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Refund Policy */}
              {displayRefundPolicy && displayRefundPolicy !== 'no_refunds' && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Refund Policy
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="capitalize">{displayRefundPolicy.replace(/_/g, ' ')}</p>
                    {displayRefundDeadlineDays && (
                      <p>Refunds available up to {displayRefundDeadlineDays} days before the event</p>
                    )}
                    {displayRefundPolicyText && (
                      <p>{displayRefundPolicyText}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {event?.socialLinks && Object.keys(event.socialLinks).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Social Links
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(event.socialLinks).map(([platform, url]) => (
                      url && (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <LinkIcon className="h-3 w-3" />
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Organizer Info */}
              {event.organizer && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Event Organizer
                  </h3>
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="font-medium text-sm">
                      {event.organizer.firstName || ''} {event.organizer.lastName || ''}
                    </p>
                    {event.organizer.organizationName && (
                      <p className="text-xs text-muted-foreground">
                        {event.organizer.organizationName}
                      </p>
                    )}
                    {event.organizerDescription && (
                      <RichTextContent
                        content={event.organizerDescription}
                        className="text-xs text-muted-foreground leading-relaxed"
                      />
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
