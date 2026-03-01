import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, MapPin, Users, Eye, Check, X, Clock, AlertCircle, MoreHorizontal, Edit, BarChart3, Download, Copy, Shield } from "lucide-react";
import { useAuthContext } from "../../../hooks/useAuthContext";
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
import { getEvents, EventStatus, getEventById, type EventData } from "../../../lib/event-api";
import { approveEvent, rejectEvent } from "../../../lib/admin-api";
import { EventPreviewModal } from "../../../components/EventPreviewModal";
import { useToast } from "../../../hooks/useToast";
import { exportEventData } from "../../../lib/utils/export";
import { getEventStatusBadgeClass, getEventTypeBadgeClass, getPriceBadgeClass } from "../../../lib/utils/event-badge-helpers";

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();

interface Event {
  id: string;
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
  useAuthContext();
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
        const response = await getEventById(previewEventId);
        if (response.success && response.data?.event) {
          setPreviewEventData(response.data.event);
        } else {
          toast({
            title: "Error",
            description: "Failed to load event details",
            variant: "destructive",
          });
          setPreviewModalOpen(false);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load event details";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
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
    // Check if it's a paid event with unverified organizer
    if (!event.isFree && !event.organizerVerified) {
      setEventToApprove(event);
      setApproveDialogOpen(true);
    } else {
      handleApprove(event.id);
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      setProcessing(eventId);
      const response = await approveEvent(eventId);
      if (response.success) {
        toast({
          title: "Event Approved",
          description: "The event has been approved successfully.",
        });
        // Remove event from list
        setEvents(events.filter(e => e.id !== eventId));
        setApproveDialogOpen(false);
        setEventToApprove(null);
      } else {
        throw new Error(response.message || 'Failed to approve event');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to approve event. Please try again.';
      console.error('Error approving event:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Please provide a rejection reason.",
        variant: "destructive",
      });
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
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to reject event. Please try again.';
      console.error('Error rejecting event:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
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
                            Edit Event
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/event/${event.id}`} target="_blank" rel="noopener noreferrer">
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
                          } catch {
                            toast({
                              title: "Error",
                              description: "Failed to export event data",
                              variant: "destructive",
                            });
                          }
                        }}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`);
                            toast({
                              title: "Copied",
                              description: "Event link copied to clipboard",
                            });
                          } catch {
                            toast({
                              title: "Error",
                              description: "Failed to copy link",
                              variant: "destructive",
                            });
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

        {/* Approve Warning Dialog for Unverified Organizers */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Unverified Organizer - Paid Event
              </DialogTitle>
              <DialogDescription>
                This is a paid event, but the organizer has not completed identity verification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="border-warning bg-warning/10">
                <Shield className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning">
                  <strong>Important:</strong> The organizer will not be able to receive payouts from ticket sales until they complete identity verification. 
                  You can still approve the event, but they will need to verify their identity to receive funds.
                </AlertDescription>
              </Alert>
              {eventToApprove && (
                <div className="text-sm space-y-1">
                  <p><strong>Event:</strong> {eventToApprove.title}</p>
                  <p><strong>Organizer:</strong> {eventToApprove.organizer}</p>
                  <p><strong>Verification Level:</strong> {eventToApprove.organizerVerificationLevel || 1} (Level 2+ required for payouts)</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setApproveDialogOpen(false);
                setEventToApprove(null);
              }}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={() => eventToApprove && handleApprove(eventToApprove.id)}
                disabled={processing === eventToApprove?.id}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {processing === eventToApprove?.id ? (
                  <>
                    <Loader size="sm" className="h-4 w-4 mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Approve Anyway
                  </>
                )}
              </Button>
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
