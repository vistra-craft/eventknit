import { useState, useEffect } from "react";
import { Search, Calendar, MapPin, Eye, Star, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Switch } from "../../../components/ui/switch";
import AdminLayout from "../AdminLayout";
import {
  getAllFeaturedEvents,
  createFeaturedEvent,
  updateFeaturedEvent,
  deleteFeaturedEvent,
  type FeaturedEventData,
  type CreateFeaturedEventData,
} from "../../../lib/featured-event-api";
import { getEvents, type EventData } from "../../../lib/event-api";

const FeaturedEventsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEventData[]>([]);
  const [availableEvents, setAvailableEvents] = useState<EventData[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingFeaturedEvent, setEditingFeaturedEvent] = useState<FeaturedEventData | null>(null);
  const [formData, setFormData] = useState<CreateFeaturedEventData>({
    eventId: "",
    customTitle: "",
    customImage: "",
    customCategory: "",
    displayStartDate: "",
    displayEndDate: "",
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchFeaturedEvents();
    fetchAvailableEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      setLoading(true);
      const data = await getAllFeaturedEvents();
      setFeaturedEvents(data);
    } catch (error) {
      console.error("Failed to fetch featured events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEvents = async () => {
    try {
      const response = await getEvents({ status: "APPROVED", limit: 100 });
      setAvailableEvents(response.data.events);
    } catch (error) {
      console.error("Failed to fetch available events:", error);
    }
  };

  const filteredEvents = featuredEvents.filter(event => {
    const title = event.customTitle || event.event.title;
    const category = event.customCategory || event.event.category || "";
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && event.isActive) ||
                         (statusFilter === "inactive" && !event.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddFeaturedEvent = async () => {
    if (!formData.eventId) {
      alert("Please select an event");
      return;
    }

    try {
      await createFeaturedEvent(formData);
      alert("Featured event created successfully");
      setShowAddDialog(false);
      setFormData({
        eventId: "",
        customTitle: "",
        customImage: "",
        customCategory: "",
        displayStartDate: "",
        displayEndDate: "",
        displayOrder: 0,
        isActive: true,
      });
      fetchFeaturedEvents();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create featured event";
      alert(errorMessage);
    }
  };

  const handleEditFeaturedEvent = async () => {
    if (!editingFeaturedEvent) return;

    try {
      await updateFeaturedEvent(editingFeaturedEvent.id, formData);
      alert("Featured event updated successfully");
      setShowEditDialog(false);
      setEditingFeaturedEvent(null);
      setFormData({
        eventId: "",
        customTitle: "",
        customImage: "",
        customCategory: "",
        displayStartDate: "",
        displayEndDate: "",
        displayOrder: 0,
        isActive: true,
      });
      fetchFeaturedEvents();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update featured event";
      alert(errorMessage);
    }
  };

  const handleDeleteFeaturedEvent = async (id: string) => {
    if (!confirm("Are you sure you want to remove this featured event?")) return;

    try {
      await deleteFeaturedEvent(id);
      alert("Featured event removed successfully");
      fetchFeaturedEvents();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete featured event";
      alert(errorMessage);
    }
  };

  const openEditDialog = (featuredEvent: FeaturedEventData) => {
    setEditingFeaturedEvent(featuredEvent);
    setFormData({
      eventId: featuredEvent.eventId,
      customTitle: featuredEvent.customTitle || "",
      customImage: featuredEvent.customImage || "",
      customCategory: featuredEvent.customCategory || "",
      displayStartDate: featuredEvent.displayStartDate ? new Date(featuredEvent.displayStartDate).toISOString().split('T')[0] : "",
      displayEndDate: featuredEvent.displayEndDate ? new Date(featuredEvent.displayEndDate).toISOString().split('T')[0] : "",
      displayOrder: featuredEvent.displayOrder,
      isActive: featuredEvent.isActive,
    });
    setShowEditDialog(true);
  };

  const selectedEvent = availableEvents.find(e => e.id === formData.eventId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Featured Events</h1>
            <p className="text-muted-foreground">Manage events featured on the platform homepage hero section</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {filteredEvents.length} of {featuredEvents.length} featured events
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
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
                  {Array.from(new Set(featuredEvents.map(e => e.customCategory || e.event.category).filter(Boolean))).map(cat => (
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
              const displayTitle = featuredEvent.customTitle || featuredEvent.event.title;
              const displayImage = featuredEvent.customImage || featuredEvent.event.image || "";
              const displayCategory = featuredEvent.customCategory || featuredEvent.event.category || "";
              
              return (
                <Card key={featuredEvent.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Event Image Preview */}
                      {displayImage && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={displayImage} 
                            alt={displayTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground truncate">{displayTitle}</h3>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                          <Badge className={`text-xs ${featuredEvent.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}`}>
                            {featuredEvent.isActive ? "Active" : "Inactive"}
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
                        <div className="text-sm text-muted-foreground">
                          Event ID: {featuredEvent.eventId}
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
                          onClick={() => window.open(`/event/${featuredEvent.eventId}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(featuredEvent)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteFeaturedEvent(featuredEvent.id)}
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

        {/* Add Featured Event Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Featured Event</DialogTitle>
              <DialogDescription>
                Select an approved event to feature on the homepage hero section
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventId">Event *</Label>
                <Select value={formData.eventId} onValueChange={(value) => setFormData({ ...formData, eventId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvents
                      .filter(e => !featuredEvents.some(fe => fe.eventId === e.id && fe.isActive))
                      .map(event => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} - {new Date(event.startDate).toLocaleDateString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEvent && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedEvent.image && (
                      <img src={selectedEvent.image} alt={selectedEvent.title} className="w-16 h-16 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-semibold">{selectedEvent.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedEvent.category || "No category"}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="customTitle">Custom Title (optional)</Label>
                <Input
                  id="customTitle"
                  placeholder="Leave empty to use event title"
                  value={formData.customTitle}
                  onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If empty, the event title will be used
                </p>
              </div>

              <div>
                <Label htmlFor="customImage">Custom Image URL (optional)</Label>
                <Input
                  id="customImage"
                  placeholder="Leave empty to use event image"
                  value={formData.customImage}
                  onChange={(e) => setFormData({ ...formData, customImage: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If empty, the event image will be used
                </p>
              </div>

              <div>
                <Label htmlFor="customCategory">Custom Category (optional)</Label>
                <Input
                  id="customCategory"
                  placeholder="Leave empty to use event category"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayStartDate">Display Start Date (optional)</Label>
                  <Input
                    id="displayStartDate"
                    type="date"
                    value={formData.displayStartDate}
                    onChange={(e) => setFormData({ ...formData, displayStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="displayEndDate">Display End Date (optional)</Label>
                  <Input
                    id="displayEndDate"
                    type="date"
                    value={formData.displayEndDate}
                    onChange={(e) => setFormData({ ...formData, displayEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower numbers appear first in the hero section
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFeaturedEvent}>
                Add Featured Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Featured Event Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Featured Event</DialogTitle>
              <DialogDescription>
                Update the featured event settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-customTitle">Custom Title (optional)</Label>
                <Input
                  id="edit-customTitle"
                  placeholder="Leave empty to use event title"
                  value={formData.customTitle}
                  onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-customImage">Custom Image URL (optional)</Label>
                <Input
                  id="edit-customImage"
                  placeholder="Leave empty to use event image"
                  value={formData.customImage}
                  onChange={(e) => setFormData({ ...formData, customImage: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-customCategory">Custom Category (optional)</Label>
                <Input
                  id="edit-customCategory"
                  placeholder="Leave empty to use event category"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-displayStartDate">Display Start Date (optional)</Label>
                  <Input
                    id="edit-displayStartDate"
                    type="date"
                    value={formData.displayStartDate}
                    onChange={(e) => setFormData({ ...formData, displayStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-displayEndDate">Display End Date (optional)</Label>
                  <Input
                    id="edit-displayEndDate"
                    type="date"
                    value={formData.displayEndDate}
                    onChange={(e) => setFormData({ ...formData, displayEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-displayOrder">Display Order</Label>
                <Input
                  id="edit-displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isActive">Active</Label>
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditFeaturedEvent}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default FeaturedEventsPage;
