import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, MapPin, Eye, X, MoreHorizontal, AlertTriangle, RotateCcw, AlertCircle, Edit, BarChart3, Download, Copy, Share2 } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";
import { Loader } from "../../../components/ui/loader";
import { getEvents, getEventById, type EventData } from "../../../lib/event-api";
import { approveEvent } from "../../../lib/admin-api";
import { useToast } from "../../../hooks/useToast";
import { shareEvent } from "../../../lib/utils/share";
import { exportEventData } from "../../../lib/utils/export";
import { getEventTypeBadgeClass, getPriceBadgeClass } from "../../../lib/utils/event-badge-helpers";
import { EventPreviewModal } from "../../../components/EventPreviewModal";

interface Event {
  id: string;
  title: string;
  organizer: string;
  date: string;
  startDate?: string;
  startTime?: string;
  location: string;
  category: string;
  type: "public" | "private";
  isFree: boolean;
  declinedDate: string;
  reason: string;
  declinedBy: string;
  isRecalled?: boolean; // Flag for recalled events
  recallReason?: string; // Reason for recall
}

const DeclinedEventsPage = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const [previewEventData, setPreviewEventData] = useState<EventData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch declined events (status = REJECTED or recalled with status = CANCELLED)
  useEffect(() => {
    const fetchDeclinedEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const filters: Record<string, unknown> = {
          declinedOrRecalledCancelled: true, // Custom filter for REJECTED or (CANCELLED + recalledAt)
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
        if (response.success && response.data?.events) {
          const declinedEvents = response.data.events.map(event => ({
            id: event.id,
            title: event.title,
            organizer: event.organizer?.organizationName || `${event.organizer?.firstName || ''} ${event.organizer?.lastName || ''}`.trim() || 'Unknown',
            date: event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD',
            startDate: event.startDate,
            startTime: event.startTime || '',
            location: event.location || event.venue || 'TBD',
            category: event.category || 'Uncategorized',
            type: (event.type === 'PUBLIC' ? 'public' : 'private') as "public" | "private",
            isFree: event.isFree || false,
            declinedDate: event.recalledAt || event.rejectedAt || event.updatedAt || event.createdAt || new Date().toISOString(),
            reason: event.recallReason || event.rejectionReason || 'No reason provided',
            declinedBy: event.recalledBy || event.rejectedBy ? 'Admin' : 'System', // TODO V2: Fetch admin name from recalledBy/rejectedBy ID
            isRecalled: !!event.recalledAt, // Flag to indicate if this was a recalled event
            recallReason: event.recallReason || undefined,
          }));
          setEvents(declinedEvents);
        }
      } catch (err) {
        console.error('Error fetching declined events:', err);
        setError('Failed to load declined events');
      } finally {
        setLoading(false);
      }
    };

    fetchDeclinedEvents();
  }, [categoryFilter, typeFilter, priceFilter, searchTerm]);

  const getDaysSinceDeclined = (declinedDate: string) => {
    const declined = new Date(declinedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - declined.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePreviewEvent = (eventId: string) => {
    setPreviewEventId(eventId);
    setPreviewModalOpen(true);
  };

  // Fetch event details for preview
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

  const filteredEvents = events.filter(event => {
    const matchesReason = reasonFilter === "all" || event.reason.toLowerCase().includes(reasonFilter.toLowerCase());
    return matchesReason;
  });

  // Get unique categories from events
  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));

  const getTypeBadge = (type: string) => {
    return getEventTypeBadgeClass(type);
  };

  const getPriceBadge = (isFree: boolean) => {
    return getPriceBadgeClass(isFree);
  };

  const handleReapprove = async (eventId: string) => {
    try {
      setProcessing(eventId);
      const response = await approveEvent(eventId);
      if (response.success) {
        toast({
          title: "Event Re-approved",
          description: "The event has been re-approved successfully.",
        });
        // Remove event from list
        setEvents(events.filter(e => e.id !== eventId));
      } else {
        throw new Error(response.message || 'Failed to re-approve event');
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'Failed to re-approve event. Please try again.';
      console.error('Error re-approving event:', err);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">Loading declined events...</span>
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
            <h1 className="text-base font-semibold text-foreground">Declined Events</h1>
            <p className="text-sm text-muted-foreground">Review events that were declined and their reasons</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredEvents.length} of {events.length} declined events
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
            <div className="mt-4">
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="content">Content Issues</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="venue">Venue Issues</SelectItem>
                  <SelectItem value="organizer">Organizer Issues</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
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
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-foreground truncate">{event.title}</h3>
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                        Declined
                      </Badge>
                      {event.isRecalled && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                          Recalled
                        </Badge>
                      )}
                      <Badge className={`text-xs ${getTypeBadge(event.type)}`}>
                        {event.type}
                      </Badge>
                      <Badge className={`text-xs ${getPriceBadge(event.isFree)}`}>
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
                        <X className="h-4 w-4" />
                        <span>Declined {getDaysSinceDeclined(event.declinedDate)} days ago</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">by {event.organizer}</p>
                    
                    {event.isRecalled && event.recallReason && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-orange-700">Recall Reason: {event.recallReason}</p>
                            <p className="text-xs text-orange-600">This event was recalled and permanently cancelled</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Reason: {event.reason}</p>
                          <p className="text-xs text-destructive/80">Declined by {event.declinedBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePreviewEvent(event.id)}
                      className="border-primary text-primary hover:bg-muted"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleReapprove(event.id)}
                      disabled={processing === event.id}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {processing === event.id ? (
                        <Loader size="sm" className="h-4 w-4 mr-1" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-1" />
                      )}
                      Re-approve
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
                              attendees: 0,
                              revenue: 0,
                              views: 0,
                              status: 'declined',
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
                        <DropdownMenuItem onClick={async () => {
                          const shared = await shareEvent(event.title, event.id);
                          if (shared) {
                            toast({
                              title: "Shared",
                              description: "Event shared successfully",
                            });
                          } else {
                            toast({
                              title: "Link Copied",
                              description: "Event link copied to clipboard",
                            });
                          }
                        }}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Event
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
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <X className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-base font-medium mb-2">No declined events found</h3>
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
      </div>
  );
};

export default DeclinedEventsPage;
