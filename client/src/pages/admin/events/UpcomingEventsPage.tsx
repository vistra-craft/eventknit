import { useState, useEffect } from "react";
import { Search, Calendar, MapPin, Users, Eye, Clock, MoreHorizontal, TrendingUp, Loader2, AlertCircle, X } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { Label } from "../../../components/ui/label";
import { EventThumbnail } from "../../../components/ui/event-thumbnail";
import AdminLayout from "../AdminLayout";
import { getEvents, EventStatus } from "../../../lib/event-api";
import { recallEvent } from "../../../lib/admin-api";

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
  image?: string;
  registrations: number;
  capacity: number;
  daysUntil: number;
}

const UpcomingEventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [showRecallDialog, setShowRecallDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [recallAction, setRecallAction] = useState<'PENDING' | 'CANCELLED'>('PENDING');
  const [recallReason, setRecallReason] = useState("");
  const [recalling, setRecalling] = useState(false);

  // Fetch upcoming events (approved events with startDate > now)
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
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
          const upcomingEvents = response.data.events
            .filter(event => {
              if (!event.startDate) return false;
              const startDate = new Date(event.startDate);
              return startDate > now;
            })
            .map(event => {
              const startDate = event.startDate ? new Date(event.startDate) : new Date();
              const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              return {
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
                registrations: event.attendees || 0,
                capacity: event.capacity || 0,
                daysUntil,
              };
            });
          setEvents(upcomingEvents);
        }
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        setError('Failed to load upcoming events');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [categoryFilter, typeFilter, priceFilter, searchTerm]);

  // Handle recall event
  const handleRecallEvent = async () => {
    if (!selectedEventId) return;
    
    try {
      setRecalling(true);
      const response = await recallEvent(selectedEventId, recallAction, recallReason || undefined);
      
      if (response.success) {
        setShowRecallDialog(false);
        setSelectedEventId(null);
        setRecallAction('PENDING');
        setRecallReason("");
        // Refresh events
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
        const response2 = await getEvents(filters);
        if (response2.success && response2.data?.events) {
          const now = new Date();
          const upcomingEvents = response2.data.events
            .filter(event => {
              if (!event.startDate) return false;
              const startDate = new Date(event.startDate);
              return startDate > now;
            })
            .map(event => {
              const startDate = event.startDate ? new Date(event.startDate) : new Date();
              const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return {
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
                registrations: event.attendees || 0,
                capacity: event.capacity || 0,
                daysUntil,
              };
            });
          setEvents(upcomingEvents);
        }
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to recall event');
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'Failed to recall event. Please try again.';
      setError(errorMessage);
    } finally {
      setRecalling(false);
    }
  };

  const openRecallDialog = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowRecallDialog(true);
  };

  const filteredEvents = events.filter(event => {
    let matchesTime = true;
    if (timeFilter === "week") {
      matchesTime = event.daysUntil <= 7;
    } else if (timeFilter === "month") {
      matchesTime = event.daysUntil <= 30;
    } else if (timeFilter === "quarter") {
      matchesTime = event.daysUntil <= 90;
    }
    
    return matchesTime;
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

  const getRegistrationRate = (registrations: number, capacity: number) => {
    if (capacity === 0) return 0;
    return Math.round((registrations / capacity) * 100);
  };

  const getDaysUntilBadge = (days: number) => {
    if (days <= 7) {
      return "bg-red-100 text-red-800 border-red-200";
    } else if (days <= 30) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "bg-green-100 text-green-800 border-green-200";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading upcoming events...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Upcoming Events</h1>
            <p className="text-gray-600">Monitor upcoming events and their registration progress</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredEvents.length} of {events.length} upcoming events
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
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Next 7 Days</SelectItem>
                  <SelectItem value="month">Next 30 Days</SelectItem>
                  <SelectItem value="quarter">Next 90 Days</SelectItem>
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
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        Active
                      </Badge>
                      <Badge className={`text-xs ${getTypeBadge(event.type)}`}>
                        {event.type}
                      </Badge>
                      <Badge className={`text-xs ${getPriceBadge(event.isFree)}`}>
                        {event.isFree ? 'free' : 'paid'}
                      </Badge>
                      <Badge className={`text-xs ${getDaysUntilBadge(event.daysUntil)}`}>
                        {event.daysUntil} days
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
                        <span>{event.registrations} / {event.capacity || '∞'} registered</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{getRegistrationRate(event.registrations, event.capacity)}% filled</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">by {event.organizer}</p>
                    {event.capacity > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${getRegistrationRate(event.registrations, event.capacity)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openRecallDialog(event.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Recall
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
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No upcoming events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recall Event Dialog */}
      <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recall Event</DialogTitle>
            <DialogDescription>
              Pull down this approved event. Choose whether to set it back to pending for re-approval or permanently cancel it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={recallAction} onValueChange={(value) => setRecallAction(value as 'PENDING' | 'CANCELLED')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PENDING" id="pending" />
                <Label htmlFor="pending" className="cursor-pointer">
                  Set to Pending (Re-approval)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CANCELLED" id="cancelled" />
                <Label htmlFor="cancelled" className="cursor-pointer">
                  Permanently Cancel
                </Label>
              </div>
            </RadioGroup>
            <div>
              <label htmlFor="recall-reason" className="text-sm font-medium">
                Reason for recall (optional)
              </label>
              <textarea
                id="recall-reason"
                className="mt-2 w-full min-h-[100px] px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
                placeholder="Enter reason for recall..."
                value={recallReason}
                onChange={(e) => setRecallReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRecallDialog(false);
                setSelectedEventId(null);
                setRecallAction('PENDING');
                setRecallReason("");
              }}
              disabled={recalling}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRecallEvent}
              disabled={recalling}
            >
              {recalling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recalling...
                </>
              ) : (
                recallAction === 'PENDING' ? 'Set to Pending' : 'Permanently Cancel'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UpcomingEventsPage;
