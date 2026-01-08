import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Eye, Star, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { EventThumbnail } from "../../../components/ui/event-thumbnail";
import { ConfirmationDialog } from "../../../components/ui/confirmation-dialog";
import { useToast } from "../../../hooks/useToast";
import AdminLayout from "../AdminLayout";
import {
  getAllFeaturedEvents,
  deleteFeaturedEvent,
  type FeaturedEventData,
} from "../../../lib/featured-event-api";

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

  const fetchFeaturedEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllFeaturedEvents();
      setFeaturedEvents(data);
    } catch (error) {
      console.error("Failed to fetch featured events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch featured events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFeaturedEvents();
  }, [fetchFeaturedEvents]);

  const filteredEvents = featuredEvents.filter(event => {
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
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete featured event";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Featured Events</h1>
            <p className="text-muted-foreground">Manage events featured on the platform homepage hero section</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {filteredEvents.length} of {featuredEvents.length} featured events
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
                          <h3 className="font-semibold text-foreground truncate">{displayTitle}</h3>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (featuredEvent.eventId) {
                              navigate(`/admin/events/${featuredEvent.eventId}/preview`);
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
                <p>Try adjusting your search or filter criteria, or add a new featured event</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Remove Featured Event"
          description="Are you sure you want to remove this featured event? This action cannot be undone."
          confirmText="Remove"
          cancelText="Cancel"
          type="danger"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
        />

      </div>
    </AdminLayout>
  );
};

export default FeaturedEventsPage;
