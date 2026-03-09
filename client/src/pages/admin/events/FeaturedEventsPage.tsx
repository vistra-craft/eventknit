import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Eye, Star, Plus, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { EventThumbnail } from "../../../components/ui/event-thumbnail";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import { useToast } from "../../../hooks/useToast";
import {
  getAllFeaturedEvents,
  deleteFeaturedEvent,
  updateFeaturedEvent,
  type FeaturedEventData,
} from "../../../lib/featured-event-api";
import { getEventById, type EventData } from "../../../lib/event-api";
import { EventPreviewModal } from "../../../components/EventPreviewModal";
import { showErrorToast } from "@/lib/utils/error";

/**
 * Check if a featured event is currently displayed on the hero section
 */
const isOnHero = (event: FeaturedEventData): boolean => {
  if (!event.isActive) return false;

  const now = new Date();

  // Check display start date
  if (event.displayStartDate) {
    const startDate = new Date(event.displayStartDate);
    if (now < startDate) return false;
  }

  // Check display end date
  if (event.displayEndDate) {
    const endDate = new Date(event.displayEndDate);
    if (now > endDate) return false;
  }

  return true;
};

const FeaturedEventsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEventData[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState<string | null>(null);
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

  const fetchFeaturedEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllFeaturedEvents();
      setFeaturedEvents(data);
    } catch (error) {
      console.error("Failed to fetch featured events:", error);
      showErrorToast(toast, error, "Fetch failed", "Failed to fetch featured events");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFeaturedEvents();
  }, [fetchFeaturedEvents]);

  const filteredEvents = [...featuredEvents].sort((a, b) => a.displayOrder - b.displayOrder).filter(event => {
    // Handle both EVENT and IMAGE types
    const isEventType = event.type === 'EVENT';
    const title = isEventType 
      ? (event.customTitle || event.event?.title || '')
      : (event.title || '');
    const category = isEventType
      ? (event.customCategory || event.event?.category || "")
      : '';
    const location = isEventType
      ? (event.event?.location || '')
      : '';
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && event.isActive) ||
                         (statusFilter === "inactive" && !event.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort events by display order for reordering
  const sortedEvents = [...featuredEvents].sort((a, b) => a.displayOrder - b.displayOrder);

  const handleMoveUp = async (event: FeaturedEventData) => {
    const currentIndex = sortedEvents.findIndex((e) => e.id === event.id);
    if (currentIndex <= 0) return;

    const prevEvent = sortedEvents[currentIndex - 1];
    setReordering(event.id);

    try {
      // Swap display orders
      await Promise.all([
        updateFeaturedEvent(event.id, { displayOrder: prevEvent.displayOrder }),
        updateFeaturedEvent(prevEvent.id, { displayOrder: event.displayOrder }),
      ]);
      await fetchFeaturedEvents();
      toast({
        title: "Reordered",
        description: "Display order updated",
      });
    } catch (error) {
      showErrorToast(toast, error, "Reorder failed", "Failed to reorder");
    } finally {
      setReordering(null);
    }
  };

  const handleMoveDown = async (event: FeaturedEventData) => {
    const currentIndex = sortedEvents.findIndex((e) => e.id === event.id);
    if (currentIndex >= sortedEvents.length - 1) return;

    const nextEvent = sortedEvents[currentIndex + 1];
    setReordering(event.id);

    try {
      // Swap display orders
      await Promise.all([
        updateFeaturedEvent(event.id, { displayOrder: nextEvent.displayOrder }),
        updateFeaturedEvent(nextEvent.id, { displayOrder: event.displayOrder }),
      ]);
      await fetchFeaturedEvents();
      toast({
        title: "Reordered",
        description: "Display order updated",
      });
    } catch (error) {
      showErrorToast(toast, error, "Reorder failed", "Failed to reorder");
    } finally {
      setReordering(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      setDeleting(true);
      await deleteFeaturedEvent(deletingId);
      toast({
        title: "Success",
        description: "Featured event removed successfully",
      });
      fetchFeaturedEvents();
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error: unknown) {
      showErrorToast(toast, error, "Delete failed", "Failed to delete featured event");
    } finally {
      setDeleting(false);
    }
  };

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Featured Events</h1>
            <p className="text-sm text-muted-foreground">Manage events featured on the platform homepage hero section</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{filteredEvents.length} of {featuredEvents.length} featured events</span>
              {featuredEvents.filter(isOnHero).length > 0 && (
                <Badge className="bg-success text-white text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  {featuredEvents.filter(isOnHero).length} On Hero
                </Badge>
              )}
            </div>
            <Button onClick={() => navigate("/admin/events/featured/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Featured Event
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search events..."
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
                  {Array.from(new Set(featuredEvents.map(e => e.customCategory || e.event?.category).filter(Boolean))).map(cat => (
                    <SelectItem key={cat} value={cat || ""}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((featuredEvent) => {
              const isEventType = featuredEvent.type === 'EVENT';
              const displayTitle = isEventType 
                ? (featuredEvent.customTitle || featuredEvent.event?.title || '')
                : (featuredEvent.title || '');
              const displayImage = isEventType
                ? (featuredEvent.customImage || featuredEvent.event?.image || "")
                : (featuredEvent.imageUrl || "");
              const displayCategory = isEventType
                ? (featuredEvent.customCategory || featuredEvent.event?.category || "")
                : '';
              
              return (
                <Card key={featuredEvent.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <EventThumbnail
                        src={displayImage}
                        alt={displayTitle}
                        category={displayCategory}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-foreground truncate">{displayTitle}</h3>
                          {isOnHero(featuredEvent) && (
                            <Badge className="bg-success text-white text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              On Hero
                            </Badge>
                          )}
                          <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                          <Badge className={`text-xs ${featuredEvent.isActive ? "bg-success-light text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
                            {featuredEvent.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className="text-xs ml-2">
                            {featuredEvent.type === 'EVENT' ? 'Event' : 'Image'}
                          </Badge>
                          {displayCategory && (
                            <Badge variant="outline" className="text-xs">
                              {displayCategory}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Order: {featuredEvent.displayOrder}
                          </Badge>
                        </div>
                        {isEventType && featuredEvent.event && (
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(featuredEvent.event.startDate).toLocaleDateString()}</span>
                              {featuredEvent.event.startTime && (
                                <span> at {featuredEvent.event.startTime}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{featuredEvent.event.location}</span>
                            </div>
                            {featuredEvent.event.venue && (
                              <div className="flex items-center gap-1">
                                <span>{featuredEvent.event.venue}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {isEventType && featuredEvent.eventId && (
                            <>Event ID: {featuredEvent.eventId}</>
                          )}
                          {!isEventType && (
                            <>Image Featured Item</>
                          )}
                          {featuredEvent.displayStartDate && (
                            <span className="ml-4">Display from: {new Date(featuredEvent.displayStartDate).toLocaleDateString()}</span>
                          )}
                          {featuredEvent.displayEndDate && (
                            <span className="ml-4">Display until: {new Date(featuredEvent.displayEndDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveUp(featuredEvent)}
                            disabled={reordering !== null || sortedEvents.findIndex(e => e.id === featuredEvent.id) === 0}
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveDown(featuredEvent)}
                            disabled={reordering !== null || sortedEvents.findIndex(e => e.id === featuredEvent.id) === sortedEvents.length - 1}
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (featuredEvent.eventId) {
                              handlePreviewEvent(featuredEvent.eventId);
                            }
                          }}
                          disabled={!featuredEvent.eventId}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/events/featured/${featuredEvent.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(featuredEvent.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filteredEvents.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">No featured events found</h3>
                <p className="text-sm">Try adjusting your search or filter criteria, or add a new featured event</p>
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

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Remove Featured Event"
          description="Are you sure you want to remove this featured event? This action cannot be undone."
          confirmText="Remove"
          cancelText="Cancel"
          variant="danger"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
        />

      </div>
  );
};

export default FeaturedEventsPage;
