import { useState, useEffect } from "react";
import { Search, Calendar, MapPin, Users, Eye, Check, X, Clock, Loader2, AlertCircle, MoreHorizontal, Edit, BarChart3, Download, Share2, Copy } from "lucide-react";
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
import AdminLayout from "../AdminLayout";
import { getEvents, EventStatus } from "../../../lib/event-api";
import { approveEvent, rejectEvent } from "../../../lib/admin-api";
import { useToast } from "../../../hooks/use-toast";
import { shareEvent } from "../../../lib/utils/share";
import { exportEventData } from "../../../lib/utils/export";

interface Event {
  id: string;
  title: string;
  organizer: string;
  organizerName?: string;
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
  const [previewEvent, setPreviewEvent] = useState<Event | null>(null);

  // Fetch pending events
  useEffect(() => {
    const fetchPendingEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEvents({ status: EventStatus.PENDING });
        if (response.success && response.data?.events) {
          const pendingEvents = response.data.events.map(event => ({
            id: event.id,
            title: event.title,
            organizer: event.organizer?.organizationName || `${event.organizer?.firstName || ''} ${event.organizer?.lastName || ''}`.trim() || 'Unknown',
            organizerName: event.organizer?.organizationName || `${event.organizer?.firstName || ''} ${event.organizer?.lastName || ''}`.trim() || 'Unknown',
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
          }));
          setEvents(pendingEvents);
        }
      } catch (err) {
        console.error('Error fetching pending events:', err);
        setError('Failed to load pending events');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const matchesPrice = priceFilter === "all" || (priceFilter === "free" && event.isFree) || (priceFilter === "paid" && !event.isFree);
    
    return matchesSearch && matchesCategory && matchesType && matchesPrice;
  });

  // Get unique categories from events
  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));

  const getTypeBadge = (type: string) => {
    return type === "public" 
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const getPriceBadge = (price: string) => {
    return price === "free" 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-orange-100 text-orange-800 border-orange-200";
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
      } else {
        throw new Error(response.message || 'Failed to approve event');
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
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
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
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
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading pending events...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Approval</h1>
            <p className="text-gray-600">Review and approve events waiting for platform approval</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredEvents.length} of {events.length} events pending
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
            <Card key={event.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
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
                      <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                        Pending
                      </Badge>
                      <Badge className={`text-xs ${getTypeBadge(event.type)}`}>
                        {event.type}
                      </Badge>
                      <Badge className={`text-xs ${getPriceBadge(event.isFree ? 'free' : 'paid')}`}>
                        {event.isFree ? 'free' : 'paid'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
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
                    <p className="text-sm text-gray-500 mb-2">by {event.organizer}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setPreviewEvent(event)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleApprove(event.id)}
                      disabled={processing === event.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing === event.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
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
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(`/admin/events/${event.id}`, '_blank')}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/event/${event.id}`, '_blank')}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Public Page
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          window.open(`/admin/analytics/events?eventId=${event.id}`, '_blank');
                        }}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analytics
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
                          } catch (error) {
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

        {filteredEvents.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No pending events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Preview Dialog */}
        <Dialog open={!!previewEvent} onOpenChange={() => setPreviewEvent(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Event Preview</DialogTitle>
              <DialogDescription>
                Review the event details before approval
              </DialogDescription>
            </DialogHeader>
            {previewEvent && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{previewEvent.title}</h2>
                  <p className="text-muted-foreground mt-1">by {previewEvent.organizer}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Pending Approval
                  </Badge>
                  <Badge className={getTypeBadge(previewEvent.type)}>
                    {previewEvent.type}
                  </Badge>
                  <Badge className={getPriceBadge(previewEvent.isFree ? 'free' : 'paid')}>
                    {previewEvent.isFree ? 'Free' : 'Paid'}
                  </Badge>
                  <Badge variant="outline">{previewEvent.category}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{previewEvent.date}</p>
                      {previewEvent.startTime && (
                        <p className="text-sm text-muted-foreground">{previewEvent.startTime}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{previewEvent.venue || previewEvent.location}</p>
                      {previewEvent.venue && previewEvent.location && (
                        <p className="text-sm text-muted-foreground">{previewEvent.location}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{previewEvent.attendees} attendees</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Submitted {getDaysSinceSubmission(previewEvent.submittedDate)} days ago
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{previewEvent.description}</p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setPreviewEvent(null)}>
                    Close
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => {
                      if (previewEvent) {
                        setPreviewEvent(null);
                        handleApprove(previewEvent.id);
                      }
                    }}
                    disabled={processing === previewEvent?.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === previewEvent?.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve Event
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
    </AdminLayout>
  );
};

export default PendingApprovalPage;
