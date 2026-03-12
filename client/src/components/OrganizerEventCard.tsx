import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Image as ImageIcon,
  Eye,
  Edit,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Loader } from "./ui/loader";
import { RichTextContent } from "./ui/RichTextContent";
import { EventImage } from "./EventImage";
import { getEventById } from "../lib/event-api";
import type { EventData } from "../types/event";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    image: string;
    imageFocalX?: number | null;
    imageFocalY?: number | null;
    date: string;
    time: string;
    venue: string;
    location: string;
    organizer: string;
    price: string;
    category: string;
    status?: string;
    description: string;
    fullDescription: string;
    duration: string;
    ageRestriction: string;
    attendees?: number;
    capacity?: number;
    revenue?: number;
    views?: number;
    conversion?: string | number;
    speakers?: number;
    exhibitors?: number;
    sponsors?: number;
  };
}

const OrganizerEventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<EventData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const status = (event.status ?? "").toUpperCase();
  const isApproved = status === "APPROVED";
  const isEditable = !["PAST", "COMPLETED", "CANCELLED", "REJECTED"].includes(status);

  // Strip HTML tags from description for clean display
  const cleanDescription = (html: string): string => {
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Use real event data for metrics
  const metrics = {
    attendees: typeof event.attendees === "number" ? event.attendees : 0,
    capacity: typeof event.capacity === "number" ? event.capacity : 0,
    revenue: typeof event.revenue === "number" ? event.revenue : 0,
    views: typeof event.views === "number" ? event.views : 0,
    conversion:
      typeof event.conversion === "string"
        ? parseFloat(event.conversion)
        : typeof event.conversion === "number"
        ? event.conversion
        : 0,
    speakers: typeof event.speakers === "number" ? event.speakers : 0,
    exhibitors: typeof event.exhibitors === "number" ? event.exhibitors : 0,
    sponsors: typeof event.sponsors === "number" ? event.sponsors : 0,
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "music":
        return "bg-primary/10 text-primary border-primary/20";
      case "comedy":
        return "bg-primary/10 text-primary border-primary/20";
      case "sports":
        return "bg-success/10 text-success border-success/20";
      case "arts":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleManageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/organizer/event/${event.id}`);
  };

  const handleEditClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate(`/organizer/events/create?edit=${event.id}`);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsViewOpen(true);
  };

  // Load full event data when the view modal opens
  useEffect(() => {
    if (!isViewOpen) return;

    let isActive = true;
    const loadEvent = async () => {
      try {
        setViewLoading(true);
        setViewError(null);
        const response = await getEventById(event.id);
        if (!isActive) return;
        if (response.success && response.data?.event) {
          setViewEvent(response.data.event);
        } else {
          setViewError("Unable to load event details.");
        }
      } catch {
        if (!isActive) return;
        setViewError("Unable to load event details.");
      } finally {
        if (isActive) setViewLoading(false);
      }
    };

    loadEvent();
    return () => { isActive = false; };
  }, [event.id, isViewOpen]);

  // Resolved preview values — fall back to card data if API data not yet loaded
  const viewTitle = viewEvent?.title || event.title;
  const viewImage = viewEvent?.image || event.image;
  const viewCategory = viewEvent?.category || event.category;
  const viewVenue = viewEvent?.venue || event.venue || event.location;
  const viewLocation = viewEvent?.location || event.location;
  const viewStartDate = viewEvent?.startDate || event.date;
  const viewStartTime = viewEvent?.startTime || event.time;
  const viewEndDate = viewEvent?.endDate || null;
  const viewEndTime = viewEvent?.endTime || null;
  const viewDescription = viewEvent?.fullDescription || viewEvent?.description || event.description || "";

  return (
    <>
      <Card className="group border border-border bg-card-surface rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Event Image */}
        <div className="relative w-full h-48 overflow-hidden bg-muted">
          <EventImage
            src={event.image}
            alt={event.title}
            focalX={event.imageFocalX}
            focalY={event.imageFocalY}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
            fallback={
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No image</p>
                </div>
              </div>
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>

        <CardContent className="p-6">
          {/* Title + status badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-xl font-medium text-foreground leading-tight">
              {event.title}
            </h3>
            {getStatusBadge()}
          </div>

          {/* Category badge */}
          {!["Tech Innovation Summit 2024", "Business Leadership Workshop", "Food & Wine Expo"].includes(event.title) && (
            <div className="mb-4">
              <Badge className={`${getCategoryColor(event.category)} border-0`}>
                <span className="capitalize">{event.category}</span>
              </Badge>
            </div>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{metrics.attendees}/{metrics.capacity || "∞"} attendees</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {cleanDescription(event.description)}
          </p>

          {/* Actions: View + Edit + Manage */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewClick}
              title="View public event page"
              aria-label={`View ${event.title}`}
              className="px-3"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {isEditable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                title="Edit event"
                aria-label={`Edit ${event.title}`}
                className="px-3"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant={isApproved ? "default" : "outline"}
              size="sm"
              onClick={handleManageClick}
              className="flex-1"
            >
              {isApproved ? "Manage" : "View Status"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Modal — public event details */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex-row items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle>Event Preview</DialogTitle>
              <DialogDescription>
                Public view of your event page
              </DialogDescription>
            </div>
            {isEditable && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setIsViewOpen(false); handleEditClick(); }}
                className="shrink-0 gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit Event
              </Button>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {viewLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader size="lg" className="text-primary" />
              </div>
            ) : viewError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {viewError}
              </div>
            ) : (
              <>
                {/* Hero image */}
                {viewImage && (
                  <div className="relative overflow-hidden rounded-xl h-64">
                    <img
                      src={viewImage}
                      alt={`Cover image for ${viewTitle}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge()}
                    </div>
                  </div>
                )}

                {/* Title + organizer */}
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold text-foreground">{viewTitle}</h3>
                  {viewCategory && (
                    <p className="text-sm text-muted-foreground capitalize">{viewCategory}</p>
                  )}
                  {(viewEvent?.organizerName || viewEvent?.organizer?.organizationName) && (
                    <p className="text-sm text-muted-foreground">
                      by {viewEvent?.organizerName || viewEvent?.organizer?.organizationName}
                    </p>
                  )}
                </div>

                {/* Date / venue / capacity */}
                <div className="grid gap-2 text-sm text-muted-foreground">
                  {(viewStartDate || viewStartTime) && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <span>
                          {viewStartDate && formatDate(viewStartDate)}
                          {viewStartTime ? ` • ${viewStartTime}` : ""}
                        </span>
                        {(viewEndDate || viewEndTime) && (
                          <div className="text-xs text-muted-foreground">
                            Ends {viewEndDate ? formatDate(viewEndDate) : ""}
                            {viewEndTime ? ` • ${viewEndTime}` : ""}
                          </div>
                        )}
                        {viewEvent?.timezone && (
                          <div className="text-xs text-muted-foreground">{viewEvent.timezone}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {(viewVenue || viewLocation || viewEvent?.onlineLink) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        {viewVenue && <div>{viewVenue}</div>}
                        {viewLocation && <div className="text-xs text-muted-foreground">{viewLocation}</div>}
                        {viewEvent?.onlineLink && (
                          <a href={viewEvent.onlineLink} className="text-primary hover:underline text-xs">
                            {viewEvent.onlineLink}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {(viewEvent?.capacity || event.capacity) && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>Capacity: {viewEvent?.capacity || event.capacity}</span>
                    </div>
                  )}
                  {viewEvent?.registrationDeadline && (
                    <p className="text-xs text-muted-foreground pl-6">
                      Registration closes {formatDate(viewEvent.registrationDeadline)}
                    </p>
                  )}
                </div>

                {/* Description */}
                {viewDescription && (
                  <div className="space-y-2">
                    <h4 className="text-section-header">About this event</h4>
                    <RichTextContent content={viewDescription} className="text-foreground/90" />
                  </div>
                )}

                {/* Tickets */}
                {viewEvent?.ticketTypes && viewEvent.ticketTypes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Tickets</h4>
                    <div className="space-y-2">
                      {viewEvent.ticketTypes.map((ticket, index) => (
                        <div
                          key={`${ticket.name}-${index}`}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div>
                            <p className="font-medium">{ticket.name || `Ticket ${index + 1}`}</p>
                            {ticket.quantity ? (
                              <p className="text-xs text-muted-foreground">{ticket.quantity} available</p>
                            ) : null}
                            {ticket.features && ticket.features.length > 0 && (
                              <p className="text-xs text-muted-foreground">{ticket.features.join(" · ")}</p>
                            )}
                          </div>
                          <span className="font-semibold">
                            {ticket.price === 0 || viewEvent?.isFree
                              ? "Free"
                              : `${viewEvent?.currency || "USD"} ${ticket.price.toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {viewEvent?.requirements && viewEvent.requirements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-section-header">Requirements</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {viewEvent.requirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Agenda */}
                {viewEvent?.agenda && viewEvent.agenda.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Agenda</h4>
                    <div className="space-y-2">
                      {viewEvent.agenda.map((item, index) => (
                        <div key={`${item.title}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{item.title}</div>
                          {(item.startTime || item.endTime) && (
                            <div className="text-xs text-muted-foreground">
                              {item.startTime || ""}{item.endTime ? ` – ${item.endTime}` : ""}
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

                {/* Speakers */}
                {viewEvent?.speakers && viewEvent.speakers.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Speakers</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {viewEvent.speakers.map((speaker, index) => (
                        <div key={`${speaker.name}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{speaker.name}</div>
                          {speaker.title && <div className="text-xs text-muted-foreground">{speaker.title}</div>}
                          {speaker.bio && <div className="text-xs text-muted-foreground mt-1">{speaker.bio}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sponsors */}
                {viewEvent?.sponsors && viewEvent.sponsors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Sponsors</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {viewEvent.sponsors.map((sponsor, index) => (
                        <div key={`${sponsor.name}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{sponsor.name}</div>
                          {sponsor.level && <div className="text-xs text-muted-foreground">{sponsor.level}</div>}
                          {sponsor.description && (
                            <div className="text-xs text-muted-foreground mt-1">{sponsor.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exhibitors */}
                {viewEvent?.exhibitors && viewEvent.exhibitors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">Exhibitors</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {viewEvent.exhibitors.map((exhibitor, index) => (
                        <div key={`${exhibitor.name}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{exhibitor.name}</div>
                          {exhibitor.booth && (
                            <div className="text-xs text-muted-foreground">Booth {exhibitor.booth}</div>
                          )}
                          {exhibitor.description && (
                            <div className="text-xs text-muted-foreground mt-1">{exhibitor.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQs */}
                {viewEvent?.faqs && viewEvent.faqs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-section-header">FAQs</h4>
                    <div className="space-y-2">
                      {viewEvent.faqs.map((faq, index) => (
                        <div key={`${faq.question}-${index}`} className="rounded-lg border border-border p-3">
                          <div className="font-medium">{faq.question}</div>
                          <div className="text-xs text-muted-foreground mt-1">{faq.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {viewEvent?.tags && viewEvent.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {viewEvent.tags.map((tag) => (
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

export default OrganizerEventCard;
