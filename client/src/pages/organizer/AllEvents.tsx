import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Eye,
  Edit,
  MoreHorizontal,
  BarChart3,
  Download,
  Share2,
  Copy,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../components/ui/dropdown-menu";
import { EventThumbnail } from "../../components/ui/event-thumbnail";
import { getOrganizerEvents, type OrganizerDashboardEvent } from "../../lib/organizer-api";
import { shareEvent } from "../../lib/utils/share";
import { exportEventData } from "../../lib/utils/export";
import { useToast } from "../../hooks/use-toast";

const AllEvents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allEvents, setAllEvents] = useState<OrganizerDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewEvent, setPreviewEvent] = useState<OrganizerDashboardEvent | null>(null);

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const filters: {
          status?: string;
          search?: string;
        } = {};
        
        if (statusFilter !== "all") {
          filters.status = statusFilter.toUpperCase();
        }
        
        if (searchTerm) {
          filters.search = searchTerm;
        }

        const response = await getOrganizerEvents(filters);

        if (response.success && response.data) {
          // Backend already transforms events to OrganizerDashboardEvent format
          setAllEvents(response.data.events as unknown as OrganizerDashboardEvent[]);
        } else {
          throw new Error(response.message || 'Failed to fetch events');
        }
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to load events. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchTerm, statusFilter]);

  // Events are already filtered by API
  const filteredEvents = allEvents;

  // Calculate stats from real data
  const totalEvents = allEvents.length;
  const activeEvents = allEvents.filter(e => e.status === "active" || e.status === "approved").length;
  const upcomingEvents = allEvents.filter(e => e.status === "upcoming").length;
  const totalRevenue = allEvents.reduce((sum, e) => sum + (typeof e.revenue === 'number' ? e.revenue : 0), 0);
  const totalAttendees = allEvents.reduce((sum, e) => sum + (typeof e.attendees === 'number' ? e.attendees : 0), 0);

  const stats = [
    {
      title: "Total Events",
      value: totalEvents.toString(),
      icon: Calendar,
      color: "text-accent-electric",
      bgColor: "bg-accent-electric/10",
      borderColor: "border-accent-electric/20",
    },
    {
      title: "Active Events",
      value: activeEvents.toString(),
      icon: CheckCircle,
      color: "text-accent-neon",
      bgColor: "bg-accent-neon/10",
      borderColor: "border-accent-neon/20",
    },
    {
      title: "Upcoming Events",
      value: upcomingEvents.toString(),
      icon: Clock,
      color: "text-accent-coral",
      bgColor: "bg-accent-coral/10",
      borderColor: "border-accent-coral/20",
    },
    {
      title: "Total Attendees",
      value: totalAttendees.toLocaleString(),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-lg font-semibold text-foreground mb-2">All Events</h1>
          <p className="text-muted-foreground">
            Manage and view all your events in one place.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/organizer/events/create"
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-card rounded-xl border ${stat.borderColor} p-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <p className="text-lg font-semibold text-foreground mb-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events by title, location, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Events Grid */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Events ({filteredEvents.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const metrics = {
                attendees: typeof event.attendees === 'number' ? event.attendees : 0,
                capacity: typeof event.capacity === 'number' ? event.capacity : 0,
                revenue: typeof event.revenue === 'number' ? event.revenue : 0,
                conversion: typeof event.conversion === 'string' ? parseFloat(event.conversion) : (typeof event.conversion === 'number' ? event.conversion : 0),
                speakers: typeof event.speakers === 'number' ? event.speakers : 0,
                exhibitors: typeof event.exhibitors === 'number' ? event.exhibitors : 0,
              };

              const getStatusBadge = (status: string) => {
                if (status === "active" || status === "approved") {
                  return "bg-green-100 text-green-800 border-green-200";
                } else if (status === "upcoming") {
                  return "bg-blue-100 text-blue-800 border-blue-200";
                } else if (status === "completed") {
                  return "bg-gray-100 text-gray-800 border-gray-200";
                } else if (status === "pending") {
                  return "bg-yellow-100 text-yellow-800 border-yellow-200";
                }
                return "bg-muted text-muted-foreground border-border";
              };

              return (
                <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <EventThumbnail
                        src={event.image}
                        alt={event.title}
                        category={event.category}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {event.title}
                          </h3>
                          <Badge className={`text-xs ${getStatusBadge(event.status || 'pending')} flex-shrink-0`}>
                            {event.status || 'pending'}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-xs mb-2">
                          {event.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date} {event.time && `at ${event.time}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{metrics.attendees}/{metrics.capacity || '∞'} attendees</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    
                    {/* Event Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Speakers</p>
                        <p className="font-semibold text-foreground">{metrics.speakers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Exhibitors</p>
                        <p className="font-semibold text-foreground">{metrics.exhibitors}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-foreground">${metrics.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {metrics.conversion.toFixed(1)}% conversion
                      </span>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewEvent(event);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/organizer/event/${event.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/organizer/event/${event.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/event/${event.id}`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Public Page
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/organizer/analytics/events?eventId=${event.id}`)}>
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
                                  attendees: typeof event.attendees === 'number' ? event.attendees : 0,
                                  revenue: typeof event.revenue === 'number' ? event.revenue : 0,
                                  views: typeof event.views === 'number' ? event.views : 0,
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
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first event."
              }
            </p>
            <Link
              to="/organizer/events/create"
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </div>
        )}
      </div>

      {/* Event Preview Dialog */}
      <Dialog 
        open={!!previewEvent} 
        onOpenChange={(open) => {
          if (!open) {
            setPreviewEvent(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Preview</DialogTitle>
            <DialogDescription>
              Preview event details
            </DialogDescription>
          </DialogHeader>
          {previewEvent && (
            <div className="space-y-6">
              {previewEvent.image && (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={previewEvent.image}
                    alt={previewEvent.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-lg font-semibold mb-2">{previewEvent.title}</h2>
                    <Badge className="bg-green-500/90 text-white">
                      {previewEvent.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              )}
              {!previewEvent.image && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">{previewEvent.title}</h2>
                  <Badge className="bg-green-500/90 text-white">
                    {previewEvent.status || 'Active'}
                  </Badge>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{previewEvent.date}</p>
                    {previewEvent.time && (
                      <p className="text-sm text-muted-foreground">{previewEvent.time}</p>
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
                  <p className="font-medium">
                    {typeof previewEvent.attendees === 'number' ? previewEvent.attendees : 0} / 
                    {typeof previewEvent.capacity === 'number' ? previewEvent.capacity : '∞'} registered
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {(() => {
                      const conversion = typeof previewEvent.conversion === 'string' 
                        ? parseFloat(previewEvent.conversion) 
                        : (typeof previewEvent.conversion === 'number' ? previewEvent.conversion : 0);
                      return `${conversion.toFixed(1)}% conversion`;
                    })()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">by {previewEvent.organizer}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {previewEvent.category}
                  </Badge>
                  {previewEvent.price && (
                    <Badge variant="outline" className="text-xs">
                      {previewEvent.price}
                    </Badge>
                  )}
                </div>
              </div>

              {previewEvent.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{previewEvent.description}</p>
                </div>
              )}

              {/* Event Metrics */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Speakers</p>
                  <p className="text-lg font-semibold">{typeof previewEvent.speakers === 'number' ? previewEvent.speakers : 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Exhibitors</p>
                  <p className="text-lg font-semibold">{typeof previewEvent.exhibitors === 'number' ? previewEvent.exhibitors : 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                  <p className="text-lg font-semibold">
                    ${typeof previewEvent.revenue === 'number' ? previewEvent.revenue.toLocaleString() : '0'}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewEvent(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setPreviewEvent(null);
                  navigate(`/organizer/event/${previewEvent.id}`);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Manage Event
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllEvents;
