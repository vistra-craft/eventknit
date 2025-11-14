import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Users, Eye, MoreHorizontal, Loader2, AlertCircle, CheckSquare, Square, Settings, Edit, BarChart3, Download, Share2, Copy, X } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";
import { EventThumbnail } from "../../../components/ui/event-thumbnail";
import { Pagination } from "../../../components/ui/pagination";
import AdminLayout from "../AdminLayout";
import { getEvents, EventStatus } from "../../../lib/event-api";
import { bulkUpdateOrganizerDataAccess } from "../../../lib/admin-api";
import { useToast } from "@/hooks/use-toast";
import { shareEvent } from "../../../lib/utils/share";
import { exportEventData } from "../../../lib/utils/export";

interface Event {
  id: string;
  title: string;
  organizer: string;
  date: string;
  startDate?: string;
  startTime?: string;
  location: string;
  venue?: string;
  attendees: number;
  status: "active" | "pending" | "cancelled" | "completed" | "declined";
  category: string;
  type: "public" | "private";
  isFree: boolean;
  image?: string;
  description?: string;
}

const AllEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkUpdateLevel, setBulkUpdateLevel] = useState<'RESTRICTED' | 'STANDARD' | 'FULL'>('RESTRICTED');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const handlePreviewEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}/preview`);
  };

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const filters: Record<string, unknown> = {};
        
        // Map frontend status to backend status
        if (statusFilter !== "all") {
          if (statusFilter === "active") {
            filters.status = EventStatus.APPROVED;
          } else if (statusFilter === "pending") {
            filters.status = EventStatus.PENDING;
          } else if (statusFilter === "cancelled") {
            filters.status = EventStatus.CANCELLED;
          } else if (statusFilter === "declined") {
            filters.status = EventStatus.REJECTED;
          }
        }
        
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

        // Add pagination
        filters.page = page;
        filters.limit = limit;

        const response = await getEvents(filters);
        if (response.success && response.data) {
          if (response.data.events) {
          const mappedEvents = response.data.events.map(event => {
            const now = new Date();
            let status: "active" | "pending" | "cancelled" | "completed" | "declined" = "pending";
            
            if (event.status === EventStatus.REJECTED) {
              status = "declined";
            } else if (event.status === EventStatus.CANCELLED) {
              status = "cancelled";
            } else if (event.status === EventStatus.APPROVED) {
              if (event.endDate && new Date(event.endDate) < now) {
                status = "completed";
              } else {
                status = "active";
              }
            } else {
              status = "pending";
            }

            return {
              id: event.id,
              title: event.title,
              organizer: event.organizer?.organizationName || `${event.organizer?.firstName || ''} ${event.organizer?.lastName || ''}`.trim() || 'Unknown',
              date: event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD',
              startDate: event.startDate,
              startTime: event.startTime || '',
              location: event.location || event.venue || 'TBD',
              venue: event.venue || undefined,
              attendees: event.registrationCount || 0,
              status,
              category: event.category || 'Uncategorized',
              type: (event.type === 'PUBLIC' ? 'public' : 'private') as "public" | "private",
              isFree: event.isFree || false,
              image: event.image || undefined,
              description: event.description || undefined,
            };
          });
          setEvents(mappedEvents);
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
        console.error('Error fetching events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [statusFilter, categoryFilter, typeFilter, priceFilter, searchTerm, page, limit]);

  // Filter events by location on frontend (other filters are handled by backend)
  const filteredEvents = events.filter(event => {
    const matchesLocation = locationFilter === "all" || event.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesLocation;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, typeFilter, priceFilter, searchTerm]);

  // Get unique categories and locations from events
  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));
  const locations = Array.from(new Set(events.map(e => e.location).filter(Boolean))).slice(0, 10);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

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

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(eventId);
      } else {
        newSet.delete(eventId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
    } else {
      setSelectedEvents(new Set());
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedEvents.size === 0) return;

    try {
      setBulkUpdating(true);
      const response = await bulkUpdateOrganizerDataAccess(
        Array.from(selectedEvents),
        bulkUpdateLevel
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Data access updated for ${response.data.updatedCount} event(s)`,
        });
        setSelectedEvents(new Set());
        setBulkUpdateDialogOpen(false);
        // Refresh events
        window.location.reload();
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'Failed to update data access';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading events...</span>
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
            <h1 className="text-lg font-semibold text-gray-900">All Events</h1>
            <p className="text-gray-600">Manage and monitor all platform events</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {filteredEvents.length} of {total} events
            </div>
            <Select value={limit.toString()} onValueChange={(value) => {
              setLimit(parseInt(value, 10));
              setPage(1); // Reset to first page when changing limit
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
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
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Toolbar */}
        {selectedEvents.size > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEvents(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => setBulkUpdateDialogOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Update Data Access
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events List */}
        <div className="space-y-3">
          {/* Select All Checkbox */}
          {filteredEvents.length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectAll(selectedEvents.size !== filteredEvents.length)}
                className="h-8 px-2"
              >
                {selectedEvents.size === filteredEvents.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm text-gray-600">
                {selectedEvents.size === filteredEvents.length ? 'Deselect all' : 'Select all'}
              </span>
            </div>
          )}

          {filteredEvents.map((event) => (
            <Card 
              key={event.id} 
              className="border-border bg-card hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectEvent(event.id, !selectedEvents.has(event.id));
                    }}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    {selectedEvents.has(event.id) ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                  <EventThumbnail
                    src={event.image}
                    alt={event.title}
                    category={event.category}
                    size="md"
                  />
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handlePreviewEvent(event.id);
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                        <Badge className={`text-xs ${getStatusBadge(event.status)}`}>
                          {event.status}
                        </Badge>
                        <Badge className={`text-xs ${getTypeBadge(event.type)}`}>
                          {event.type}
                        </Badge>
                        <Badge className={`text-xs ${getPriceBadge(event.isFree ? 'free' : 'paid')}`}>
                          {event.isFree ? 'free' : 'paid'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                        <span className="text-gray-500">by {event.organizer}</span>
                      </div>
                    </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handlePreviewEvent(event.id);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                         {event.status === "active" && (
                           <Button
                             variant="destructive"
                             size="sm"
                             onClick={(e) => {
                               e.stopPropagation();
                               // Open recall dialog - functionality already exists in UpcomingEventsPage
                               // For now, navigate to upcoming events page where recall is available
                               window.open(`/admin/events/upcoming`, '_blank');
                             }}
                           >
                             <X className="h-4 w-4 mr-1" />
                             Recall
                           </Button>
                         )}
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
                              revenue: 0, // Not available in this context
                              views: 0, // Not available in this context
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
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Update Dialog */}
        <Dialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Data Access Level</DialogTitle>
              <DialogDescription>
                Update organizer data access for {selectedEvents.size} selected event{selectedEvents.size !== 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Access Level
                </label>
                <Select value={bulkUpdateLevel} onValueChange={(value: 'RESTRICTED' | 'STANDARD' | 'FULL') => setBulkUpdateLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESTRICTED">RESTRICTED - Summary only</SelectItem>
                    <SelectItem value="STANDARD">STANDARD - Attendees + payment summaries</SelectItem>
                    <SelectItem value="FULL">FULL - All details except transaction IDs</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  {bulkUpdateLevel === 'RESTRICTED' && 'Organizers can only see summary cards (total attendees, total revenue)'}
                  {bulkUpdateLevel === 'STANDARD' && 'Organizers can see attendee list and payment summaries (no transaction IDs)'}
                  {bulkUpdateLevel === 'FULL' && 'Organizers can see all payment details except transaction IDs'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkUpdateDialogOpen(false)}
                disabled={bulkUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpdate}
                disabled={bulkUpdating}
              >
                {bulkUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Access Level'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
};

export default AllEventsPage;
