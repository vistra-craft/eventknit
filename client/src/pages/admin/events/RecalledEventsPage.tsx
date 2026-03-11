import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, MapPin, Eye, MoreHorizontal, AlertTriangle, AlertCircle, Edit, BarChart3, Download, Copy, Share2, RotateCcw } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";
import { Loader } from "../../../components/ui/loader";
import { getEvents, getEventById, EventType, type EventData } from "../../../lib/event-api";
import { approveEvent } from "../../../lib/admin-api";
import { useToast } from "../../../hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import { shareEvent } from "../../../lib/utils/share";
import { exportEventData } from "../../../lib/utils/export";
import { getEventTypeBadgeClass, getPriceBadgeClass } from "../../../lib/utils/event-badge-helpers";
import { EventPreviewModal } from "../../../components/EventPreviewModal";

interface RecalledEvent {
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
  recalledDate: string;
  recallReason: string;
  recalledBy: string;
}

const RecalledEventsPage = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<RecalledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const [previewEventData, setPreviewEventData] = useState<EventData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const fetchRecalledEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch both recalled to PENDING and recalled to CANCELLED
        const cancelledResponse = await getEvents({
          recalledCancelled: true,
          ...(categoryFilter !== "all" && { category: categoryFilter }),
          ...(typeFilter !== "all" && { type: (typeFilter === "public" ? "PUBLIC" : "PRIVATE") as EventType }),
          ...(priceFilter !== "all" && { isFree: priceFilter === "free" }),
          ...(searchTerm && { search: searchTerm }),
        });

        const pendingResponse = await getEvents({
          recalledPending: true,
          ...(categoryFilter !== "all" && { category: categoryFilter }),
          ...(typeFilter !== "all" && { type: (typeFilter === "public" ? "PUBLIC" : "PRIVATE") as EventType }),
          ...(priceFilter !== "all" && { isFree: priceFilter === "free" }),
          ...(searchTerm && { search: searchTerm }),
        });

        // Combine both responses
        const allRecalledEvents = [
          ...(cancelledResponse.success ? cancelledResponse.data?.events || [] : []),
          ...(pendingResponse.success ? pendingResponse.data?.events || [] : []),
        ];

        if (cancelledResponse.success || pendingResponse.success) {
          const recalledEvents = allRecalledEvents.map(event => ({
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
            recalledDate: event.recalledAt || event.updatedAt || event.createdAt || new Date().toISOString(),
            recallReason: event.recallReason || 'No reason provided',
            recalledBy: event.recalledBy ? 'Admin' : 'System',
          }));
          setEvents(recalledEvents);
        }
      } catch (err) {
        console.error('Error fetching recalled events:', err);
        setError('Failed to load recalled events');
      } finally {
        setLoading(false);
      }
    };

    fetchRecalledEvents();
  }, [categoryFilter, typeFilter, priceFilter, searchTerm]);

  const getDaysSinceRecalled = (recalledDate: string) => {
    const recalled = new Date(recalledDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - recalled.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePreviewEvent = (eventId: string) => {
    setPreviewEventId(eventId);
    setPreviewModalOpen(true);
  };

  useEffect(() => {
    const fetchPreviewEvent = async () => {
      if (!previewEventId || !previewModalOpen) return;
      try {
        setPreviewLoading(true);
        const response = await getEventById(previewEventId);
        if (response.success && response.data?.event) {
          setPreviewEventData(response.data.event);
        } else {
          showErrorToast(toast, null, "Failed to load event details");
          setPreviewModalOpen(false);
        }
      } catch (error: unknown) {
        showErrorToast(toast, error, "Failed to load event details");
        setPreviewModalOpen(false);
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchPreviewEvent();
  }, [previewEventId, previewModalOpen, toast]);

  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));

  const handleReapprove = async (eventId: string) => {
    try {
      setProcessing(eventId);
      const response = await approveEvent(eventId);
      if (response.success) {
        toast({ title: "Event Re-approved", description: "The event has been re-approved successfully." });
        setEvents(events.filter(e => e.id !== eventId));
      } else {
        throw new Error(response.message || 'Failed to re-approve event');
      }
    } catch (err: unknown) {
      showErrorToast(toast, err, "Re-approve failed", "Failed to re-approve event. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="lg" className="h-8 w-8" />
        <span className="ml-2 text-muted-foreground">Loading recalled events...</span>
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
          <h1 className="text-base font-semibold text-foreground">Recalled Events</h1>
          <p className="text-sm text-muted-foreground">Events that were approved and live, then pulled down by an admin</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {events.length} recalled event{events.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          {categories.length > 0 && (
            <div className="mt-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-foreground truncate">{event.title}</h3>
                    <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700/50 text-xs">
                      Recalled
                    </Badge>
                    <Badge className={`text-xs ${getEventTypeBadgeClass(event.type)}`}>
                      {event.type}
                    </Badge>
                    <Badge className={`text-xs ${getPriceBadgeClass(event.isFree)}`}>
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
                      <AlertTriangle className="h-4 w-4" />
                      <span>Recalled {getDaysSinceRecalled(event.recalledDate)} days ago</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">by {event.organizer}</p>
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-lg p-3 mb-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Recall Reason: {event.recallReason}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Recalled by {event.recalledBy}</p>
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
                          Manage Event
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
                            status: 'recalled',
                            category: event.category,
                          });
                          toast({ title: "Exported", description: "Event data exported successfully" });
                        } catch (error) {
                          showErrorToast(toast, error, "Export failed", "Failed to export event data");
                        }
                      }}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`);
                          toast({ title: "Copied", description: "Event link copied to clipboard" });
                        } catch (error) {
                          showErrorToast(toast, error, "Copy failed", "Failed to copy link");
                        }
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Event Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => {
                        const shared = await shareEvent(event.title, event.id);
                        if (shared) {
                          toast({ title: "Shared", description: "Event shared successfully" });
                        } else {
                          toast({ title: "Link Copied", description: "Event link copied to clipboard" });
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

      {events.length === 0 && (
        <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-base font-medium mb-2">No recalled events found</h3>
              <p>Recalled events appear here when an admin pulls down a previously approved event</p>
            </div>
          </CardContent>
        </Card>
      )}

      <EventPreviewModal
        isOpen={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        event={previewEventData}
        loading={previewLoading}
      />
    </div>
  );
};

export default RecalledEventsPage;
