import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, MapPin, Users, Eye, Check, X, Clock, AlertCircle, MoreHorizontal, Edit, BarChart3, Download, Copy, Shield, ExternalLink, Mail } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Textarea } from "../../../components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";
import { EventThumbnail } from "../../../components/ui/event-thumbnail";
import { Pagination } from "../../../components/ui/pagination";
import { Loader } from "../../../components/ui/loader";
import { getEvents, EventStatus, type EventData } from "../../../lib/event-api";
import { approveEvent, rejectEvent, getAdminEventById, sendKYCReminder } from "../../../lib/admin-api";
import { EventPreviewModal } from "../../../components/EventPreviewModal";
import { useToast } from "../../../hooks/useToast";
import { exportEventData } from "../../../lib/utils/export";
import { getEventStatusBadgeClass, getEventTypeBadgeClass, getPriceBadgeClass } from "../../../lib/utils/event-badge-helpers";
import { extractErrorMessage, showErrorToast } from "../../../lib/utils/error";

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();

interface Event {
  id: string;
  slug?: string | null;
  title: string;
  organizer: string;
  organizerName?: string;
  organizerId?: string;
  organizerVerified?: boolean;
  organizerVerificationLevel?: number;
  date: string;
  startDate?: string;
  startTime?: string;
  location: string;
  venue?: string;
  attendees: number;
  status: string;
  category: string;
  type: "public" | "private";
  isFree: boolean;
  submittedDate: string;
  createdAt: string;
  description: string;
  image?: string;
  isRecalled?: boolean; // Flag for recalled events
  recallReason?: string; // Reason for recall
  recalledAt?: string; // Date when event was recalled
}

const PendingApprovalPage = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [eventToApprove, setEventToApprove] = useState<Event | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const [previewEventData, setPreviewEventData] = useState<EventData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreviewEvent = (eventId: string) => {
    setPreviewEventId(eventId);
    setPreviewModalOpen(true);
  };

  // Fetch event details for preview modal
  useEffect(() => {
    const fetchPreviewEvent = async () => {
      if (!previewEventId || !previewModalOpen) return;

      try {
        setPreviewLoading(true);
        const response = await getAdminEventById(previewEventId);
        if (response.success && response.data?.event) {
          setPreviewEventData(response.data.event);
        } else {
          showErrorToast(toast, new Error("Failed to load event details"), "Preview failed", "Failed to load event details");
          setPreviewModalOpen(false);
        }
      } catch (error: unknown) {
        showErrorToast(toast, error, "Preview failed", "Failed to load event details");
        setPreviewModalOpen(false);
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreviewEvent();
  }, [previewEventId, previewModalOpen, toast]);

  // Fetch pending events (including recalled events sent back for re-approval)
  useEffect(() => {
    const fetchPendingEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const filters: Record<string, unknown> = {
          status: EventStatus.PENDING,
          page,
          limit,
        };
        
        if (categoryFilter !== "all") {
          filters.category = categoryFilter;
        }
        
        if (typeFilter !== "all") {
          filters.type = typeFilter === "public" ? "PUBLIC" : "PRIVATE";
        }
        
        if (priceFilter !== "all") {
          filters.isFree = priceFilter === "free";
        }
        
        if (searchTerm) {
          filters.search = searchTerm;
        }
        
        const response = await getEvents(filters);
        if (response.success && response.data) {
          if (response.data.events) {
          const pendingEvents = response.data.events.map(event => ({
            id: event.id,
            slug: event.slug ?? null,
            title: event.title,
            organizer: event.organizer?.organizationName || `${event.organizer?.firstName || ''} ${event.organizer?.lastName || ''}`.trim() || 'Unknown',
            organizerName: event.organizer?.organizationName || `${event.organizer?.firstName || ''} ${event.organizer?.lastName || ''}`.trim() || 'Unknown',
            organizerId: event.organizer?.id,
            organizerVerified: Boolean(event.organizer?.isIdentityVerified),
            organizerVerificationLevel: event.organizer?.verificationLevel ?? 1,
            date: event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD',
            startDate: event.startDate,
            startTime: event.startTime || '',
            location: event.location || event.venue || 'TBD',
            venue: event.venue || undefined,
            attendees: event.attendees || 0,
            status: event.status || 'PENDING',
            category: event.category || 'Uncategorized',
            type: (event.type === 'PUBLIC' ? 'public' : 'private') as "public" | "private",
            isFree: event.isFree || false,
            submittedDate: event.createdAt || new Date().toISOString(),
            createdAt: event.createdAt || new Date().toISOString(),
            description: event.description || '',
            image: event.image || undefined,
            isRecalled: Boolean(event.recalledAt), // Flag for recalled events
            recallReason: event.recallReason ?? undefined,
            recalledAt: event.recalledAt ?? undefined,
          }));
          setEvents(pendingEvents);
          }
          
          // Update pagination info
          if (response.data.totalPages !== undefined) {
            setTotalPages(response.data.totalPages);
          }
          if (response.data.total !== undefined) {
            setTotal(response.data.total);
          }
        }
      } catch (err) {
        console.error('Error fetching pending events:', err);
        setError('Failed to load pending events');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingEvents();
  }, [page, limit, categoryFilter, priceFilter, searchTerm, typeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, typeFilter, priceFilter]);

  // Filters are handled by backend, no need for frontend filtering
  const filteredEvents = events;

  // Get unique categories from events
  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));

  const getTypeBadge = (type: string) => {
    return getEventTypeBadgeClass(type);
  };

  const getPriceBadge = (price: string) => {
    return price === "free" 
      ? getPriceBadgeClass(true)
      : getPriceBadgeClass(false);
  };

  const handleApproveClick = (event: Event) => {
    handleApprove(event);
  };

  const handleApprove = async (event: Event) => {
    try {
      setProcessing(event.id);
      const response = await approveEvent(event.id);
      if (response.success) {
        toast({
          title: "Event Approved",
          description: "The event has been approved successfully.",
        });
        // Remove event from list
        setEvents(events.filter(e => e.id !== event.id));
        setApproveDialogOpen(false);
        setEventToApprove(null);
      } else {
        throw new Error(response.message || 'Failed to approve event');
      }
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, 'Failed to approve event. Please try again.');
      console.error('Error approving event:', err);

      // Check if this is a KYC verification error — show dialog instead of toast
      const isKycError = errorMessage.toLowerCase().includes('kyc') || errorMessage.toLowerCase().includes('verification');
      if (isKycError && !event.isFree) {
        setEventToApprove(event);
        setApproveDialogOpen(true);
      } else {
        toast({
          title: "Approval Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = (eventId: string) => {
    setSelectedEventId(eventId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedEventId || !rejectionReason.trim()) {
      showErrorToast(toast, new Error("Please provide a rejection reason."), "Validation error", "Please provide a rejection reason.");
      return;
    }

    try {
      setProcessing(selectedEventId);
      const response = await rejectEvent(selectedEventId, rejectionReason);
      if (response.success) {
        toast({
          title: "Event Rejected",
          description: "The event has been rejected successfully.",
        });
        // Remove event from list
        setEvents(events.filter(e => e.id !== selectedEventId));
        setRejectDialogOpen(false);
        setSelectedEventId(null);
        setRejectionReason("");
      } else {
        throw new Error(response.message || 'Failed to reject event');
      }
    } catch (err: unknown) {
      console.error('Error rejecting event:', err);
      showErrorToast(toast, err, "Reject failed", "Failed to reject event. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const getDaysSinceSubmission = (submittedDate: string) => {
    const submitted = new Date(submittedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">Loading pending events...</span>
        </div>
    );
  }

  if (error) {
    return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Pending Approval</h1>
            <p className="text-sm text-muted-foreground">Review and approve events waiting for platform approval</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredEvents.length} of {total || events.length} events pending
            </div>
            <Select value={limit.toString()} onValueChange={(value) => {
              setLimit(parseInt(value, 10));
              setPage(1);
            }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search events or organizers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <EventThumbnail
                    src={event.image}
                    alt={event.title}
                    category={event.category}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-foreground truncate">{event.title}</h3>
                      <Badge className={`${getEventStatusBadgeClass('pending')} text-xs`}>
                        Pending
                      </Badge>
                      {event.isRecalled && (
                        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs">
                          Recalled
                        </Badge>
                      )}
                      <Badge className={`text-xs ${getTypeBadge(event.type)}`}>
                        {event.type}
                      </Badge>
                      <Badge className={`text-xs ${getPriceBadge(event.isFree ? 'free' : 'paid')}`}>
                        {event.isFree ? 'free' : 'paid'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date} {event.startTime && `at ${event.startTime}`}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{event.attendees} attendees</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Submitted {getDaysSinceSubmission(event.submittedDate)} days ago</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-muted-foreground">by {event.organizer}</p>
                      {!event.isFree && !event.organizerVerified && (
                        <Badge className="bg-warning/10 text-warning border-warning/20 text-xs flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Unverified Organizer
                        </Badge>
                      )}
                      {!event.isFree && event.organizerVerified && (
                        <Badge className="bg-success-light text-success border-success/20 text-xs flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {event.isRecalled && event.recallReason && (
                      <Alert className="mb-2 border-orange-500/20 bg-orange-500/5">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-sm text-orange-700">
                          <strong>Recall Reason:</strong> {event.recallReason}
                        </AlertDescription>
                      </Alert>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">{stripHtml(event.description)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-0 sm:ml-4 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handlePreviewEvent(event.id)} className="border-primary text-primary hover:bg-muted">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleApproveClick(event)}
                      disabled={processing === event.id}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {processing === event.id ? (
                        <Loader size="sm" className="h-4 w-4 mr-1" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDecline(event.id)}
                      disabled={processing === event.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/events/${event.id}`} target="_blank" rel="noopener noreferrer">
                            <Edit className="h-4 w-4 mr-2" />
                            Manage Event
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/event/${event.slug ?? event.id}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Public Page
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/analytics/events?eventId=${event.id}`} target="_blank" rel="noopener noreferrer">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          try {
                            exportEventData({
                              id: event.id,
                              title: event.title,
                              date: event.date,
                              location: event.location,
                              attendees: event.attendees,
                              revenue: 0,
                              views: 0,
                              status: event.status,
                              category: event.category,
                            });
                            toast({
                              title: "Exported",
                              description: "Event data exported successfully",
                            });
                          } catch (error) {
                            showErrorToast(toast, error, "Export failed", "Failed to export event data");
                          }
                        }}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/event/${event.slug ?? event.id}`);
                            toast({
                              title: "Copied",
                              description: "Event link copied to clipboard",
                            });
                          } catch (error) {
                            showErrorToast(toast, error, "Copy failed", "Failed to copy link");
                          }
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Event Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {filteredEvents.length === 0 && !loading && (
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-base font-medium mb-2">No pending events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Event Preview Modal */}
        <EventPreviewModal
          isOpen={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          event={previewEventData}
          loading={previewLoading}
        />

        {/* KYC Required Dialog — shown when approving a paid event whose organizer hasn't completed KYC */}
        <Dialog open={approveDialogOpen} onOpenChange={(open) => {
          setApproveDialogOpen(open);
          if (!open) setEventToApprove(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                KYC Verification Required
              </DialogTitle>
              <DialogDescription>
                This paid event cannot be approved until the organizer completes KYC verification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  Paid events require the organizer to have approved KYC documents before the event can go live.
                  Please review their KYC submission and approve it first, then come back to approve this event.
                </AlertDescription>
              </Alert>
              {eventToApprove && (
                <div className="text-sm space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                  <p><strong>Event:</strong> {eventToApprove.title}</p>
                  <p><strong>Organizer:</strong> {eventToApprove.organizerName || eventToApprove.organizer}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => {
                setApproveDialogOpen(false);
                setEventToApprove(null);
              }}>
                Close
              </Button>
              {eventToApprove?.organizerId && (
                <>
                  <Button
                    variant="outline"
                    disabled={sendingReminder}
                    onClick={async () => {
                      if (!eventToApprove.organizerId) return;
                      setSendingReminder(true);
                      try {
                        await sendKYCReminder(eventToApprove.organizerId, eventToApprove.title);
                        toast({
                          title: "Reminder sent",
                          description: `KYC verification reminder emailed to ${eventToApprove.organizerName || eventToApprove.organizer}.`,
                        });
                      } catch (error) {
                        showErrorToast(toast, error, "Failed to send reminder");
                      } finally {
                        setSendingReminder(false);
                      }
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {sendingReminder ? "Sending..." : "Send Reminder"}
                  </Button>
                  <Button asChild>
                    <Link
                      to={`/admin/kyc/review/${eventToApprove.organizerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Review Organizer KYC
                    </Link>
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Event</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this event. This will be sent to the organizer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || processing === selectedEventId}
              >
                {processing === selectedEventId ? (
                  <>
                    <Loader size="sm" className="h-4 w-4 mr-2" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Event'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default PendingApprovalPage;
