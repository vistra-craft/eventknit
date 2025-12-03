import { useState, useEffect } from "react";
import { Search, Calendar, MapPin, Eye, X, MoreHorizontal, AlertTriangle, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import AdminLayout from "../AdminLayout";
import { getEvents, EventStatus } from "../../../lib/event-api";
import { approveEvent } from "../../../lib/admin-api";
import { useToast } from "../../../hooks/use-toast";

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

  // Fetch declined events (status = REJECTED)
  useEffect(() => {
    const fetchDeclinedEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const filters: Record<string, unknown> = {
          status: EventStatus.REJECTED,
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
            declinedDate: event.updatedAt || event.createdAt || new Date().toISOString(),
            reason: (event as { rejectionReason?: string }).rejectionReason || 'No reason provided',
            declinedBy: 'Admin', // TODO: Get from audit logs
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

  const filteredEvents = events.filter(event => {
    const matchesReason = reasonFilter === "all" || event.reason.toLowerCase().includes(reasonFilter.toLowerCase());
    return matchesReason;
  });

  // Get unique categories from events
  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));

  const getTypeBadge = (type: string) => {
    return type === "public" 
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const getPriceBadge = (isFree: boolean) => {
    return isFree
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-orange-100 text-orange-800 border-orange-200";
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

  const getDaysSinceDeclined = (declinedDate: string) => {
    const declined = new Date(declinedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - declined.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading declined events...</span>
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
            <h1 className="text-lg font-semibold text-gray-900">Declined Events</h1>
            <p className="text-gray-600">Review events that were declined and their reasons</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredEvents.length} of {events.length} declined events
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
            <Card key={event.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                        Declined
                      </Badge>
                      <Badge className={`text-xs ${getTypeBadge(event.type)}`}>
                        {event.type}
                      </Badge>
                      <Badge className={`text-xs ${getPriceBadge(event.isFree)}`}>
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
                        <X className="h-4 w-4" />
                        <span>Declined {getDaysSinceDeclined(event.declinedDate)} days ago</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">by {event.organizer}</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Reason: {event.reason}</p>
                          <p className="text-xs text-red-600">Declined by {event.declinedBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleReapprove(event.id)}
                      disabled={processing === event.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing === event.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-1" />
                      )}
                      Re-approve
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
                <X className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No declined events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default DeclinedEventsPage;
