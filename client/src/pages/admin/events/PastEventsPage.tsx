import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, MapPin, Users, Eye, History, MoreHorizontal, TrendingUp, AlertCircle, Edit, BarChart3, Download, Copy, Share2 } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Loader } from "../../../components/ui/loader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import { getEvents, EventStatus, getEventById, type EventData } from "../../../lib/event-api";
import { getEventTypeBadgeClass, getPriceBadgeClass } from "../../../lib/utils/event-badge-helpers";
import { exportEventData } from "../../../lib/utils/export";
import { shareEvent } from "../../../lib/utils/share";
import { EventPreviewModal } from "../../../components/EventPreviewModal";

interface Event {
  id: string;
  slug?: string | null;
  title: string;
  organizer: string;
  date: string;
  startDate?: string;
  startTime?: string;
  location: string;
  category: string;
  type: "public" | "private";
  isFree: boolean;
  actualAttendees: number;
  expectedAttendees: number;
  revenue: number;
  rating: number;
}

const PastEventsPage = () => {
  const { toast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const [previewEventData, setPreviewEventData] = useState<EventData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch past events (approved events with endDate < now or status = COMPLETED)
  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const filters: Record<string, unknown> = {
          status: EventStatus.APPROVED,
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
          const now = new Date();
          const pastEvents = response.data.events
            .filter(event => {
              if (event.status === 'COMPLETED') return true;
              if (event.endDate) {
                const endDate = new Date(event.endDate);
                return endDate < now;
              }
              if (event.startDate) {
                const startDate = new Date(event.startDate);
                return startDate < now;
              }
              return false;
            })
            .map(event => {
              // Get registration count from transformed data
              const registrations = event.registrationCount || event.attendees || 0;
              // Calculate approximate revenue: price * registrations (for paid events)
              const eventPrice = typeof event.price === 'number' ? event.price : 0;
              const estimatedRevenue = event.isFree ? 0 : eventPrice * registrations;

              return {
                id: event.id,
                slug: event.slug ?? null,
                title: event.title,
                organizer: event.organizer?.organizationName || `${event.organizer?.firstName || ''} ${event.organizer?.lastName || ''}`.trim() || 'Unknown',
                date: event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD',
                startDate: event.startDate,
                startTime: event.startTime || '',
                location: event.location || event.venue || 'TBD',
                category: event.category || 'Uncategorized',
                type: (event.type === 'PUBLIC' ? 'public' : 'private') as "public" | "private",
                isFree: event.isFree || false,
                actualAttendees: registrations,
                expectedAttendees: event.capacity || registrations || 0,
                revenue: estimatedRevenue, // Estimated from base price * registrations
                rating: 0, // TODO V2: Implement rating system
              };
            });
          setEvents(pastEvents);
        }
      } catch (err) {
        console.error('Error fetching past events:', err);
        setError('Failed to load past events');
      } finally {
        setLoading(false);
      }
    };

    fetchPastEvents();
  }, [categoryFilter, typeFilter, priceFilter, searchTerm]);

  const filteredEvents = events.filter(event => {
    const matchesMonth = monthFilter === "all" || 
      (event.startDate && new Date(event.startDate).getMonth() === parseInt(monthFilter));
    return matchesMonth;
  });

  // Get unique categories from events
  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));

  const getTypeBadge = (type: string) => {
    return getEventTypeBadgeClass(type);
  };

  const getPriceBadge = (isFree: boolean) => {
    return getPriceBadgeClass(isFree);
  };

  const getAttendanceRate = (expected: number, actual: number) => {
    if (expected === 0) return 0;
    return Math.round((actual / expected) * 100);
  };

  const months = [
    { value: "all", label: "All Months" },
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" }
  ];

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
        if (response.success && response.data) {
          setPreviewEventData(response.data.event || null);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        showErrorToast(toast, err, "Preview failed", "Failed to load event details");
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchPreviewEvent();
  }, [previewEventId, previewModalOpen, toast]);

  if (loading) {
    return (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" className="h-8 w-8" />
          <span className="ml-2 text-muted-foreground">Loading past events...</span>
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
            <h1 className="text-base font-semibold text-foreground">Past Events</h1>
            <p className="text-sm text-muted-foreground">View completed events and their performance metrics</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredEvents.length} of {events.length} past events
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
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
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
                      <Badge className="bg-muted text-muted-foreground border-border text-xs">
                        Completed
                      </Badge>
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
                        <Users className="h-4 w-4" />
                        <span>{event.actualAttendees} / {event.expectedAttendees} attendees</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{getAttendanceRate(event.expectedAttendees, event.actualAttendees)}% attendance</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">by {event.organizer}</p>
                    <div className="flex items-center gap-4 text-sm">
                      {event.rating > 0 && (
                        <span className="text-muted-foreground">Rating: {event.rating}/5.0</span>
                      )}
                      {event.revenue > 0 && (
                        <span className="text-muted-foreground">Revenue: ${event.revenue.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-0 sm:ml-4 flex-shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePreviewEvent(event.id)}
                      className="border-primary text-primary hover:bg-muted"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
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
                              attendees: event.actualAttendees,
                              revenue: event.revenue,
                              views: 0,
                              status: 'completed',
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
                        <DropdownMenuItem onClick={async () => {
                          const shared = await shareEvent(event.title, event.slug ?? event.id);
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
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-base font-medium mb-2">No past events found</h3>
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

export default PastEventsPage;
