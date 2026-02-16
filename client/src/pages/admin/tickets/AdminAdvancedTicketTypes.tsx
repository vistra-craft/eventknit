/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Ticket,
  Plus,
  Trash2,
  Users,
  Gift,
  Heart,
  Armchair,
  Search,
  Calendar,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import {
  createTicketPackage,
  getEventTicketPackages,
  getReservedSeating,
  deleteTicketPackage,
} from "@/lib/organizer-dashboard-api";
import { getEvents, EventStatus } from "@/lib/event-api";
import { useToast } from "@/hooks/useToast";
import { useParams, useNavigate } from "react-router-dom";

interface TicketPackage {
  id: string;
  name: string;
  description?: string;
  type: "group" | "bundle" | "donation";
  price?: number;
  minQuantity?: number;
  maxQuantity?: number;
  isDonation: boolean;
  minDonation?: number;
  maxDonation?: number;
  hasReservedSeating: boolean;
  quantity?: number;
  soldQuantity: number;
  isActive: boolean;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
  status: string;
  image?: string;
  category?: string;
}

const AdminAdvancedTicketTypes = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<TicketPackage[]>([]);
  interface ReservedSeating {
    id: string;
    name?: string;
    soldQuantity?: number;
    quantity?: number | null;
    seatingChart?: unknown;
  }

  const [, setReservedSeating] = useState<ReservedSeating[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("packages");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Event selector state
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingEvents, setLoadingEvents] = useState(false);

  // Fetch events for selector
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const response = await getEvents({ limit: 50, status: EventStatus.APPROVED });
      if (response.success && response.data?.events) {
        setEvents(response.data.events as Event[]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (!eventId) {
      fetchEvents();
    }
  }, [eventId, fetchEvents]);

  const fetchPackages = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const response = await getEventTicketPackages(eventId);
      if (response.success && response.data) {
        setPackages(response.data.packages || []);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "Failed to load ticket packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  const fetchReservedSeating = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await getReservedSeating(eventId);
      if (response.success && response.data) {
        const seatingData = Array.isArray(response.data.seating)
          ? (response.data.seating as ReservedSeating[])
          : [];
        setReservedSeating(seatingData);
      }
    } catch (error) {
      console.error("Error fetching reserved seating:", error);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchPackages();
      if (activeTab === "seating") {
        fetchReservedSeating();
      }
    }
  }, [eventId, activeTab, fetchPackages, fetchReservedSeating]);

  type CreatePackagePayload = Parameters<typeof createTicketPackage>[0];

  const handleCreatePackage = async (data: Partial<TicketPackage>) => {
    if (!eventId) return;
    try {
      if (!data.name) {
        toast({
          title: "Name is required",
          description: "Please provide a package name.",
          variant: "destructive",
        });
        return;
      }

      const payload: CreatePackagePayload = {
        eventId,
        name: data.name,
        description: data.description,
        type: data.type ?? "group",
        price: data.price,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        isDonation: data.isDonation ?? false,
        minDonation: data.minDonation,
        maxDonation: data.maxDonation,
        hasReservedSeating: data.hasReservedSeating ?? false,
        quantity: data.quantity,
      };

      const response = await createTicketPackage(payload);
      if (response.success) {
        toast({
          title: "Success",
          description: "Ticket package created successfully",
        });
        setIsCreateDialogOpen(false);
        fetchPackages();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive",
      });
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const response = await deleteTicketPackage(packageId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Package deleted successfully",
        });
        fetchPackages();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "group":
        return <Users className="h-5 w-5" />;
      case "bundle":
        return <Gift className="h-5 w-5" />;
      case "donation":
        return <Heart className="h-5 w-5" />;
      default:
        return <Ticket className="h-5 w-5" />;
    }
  };

  const handleSelectEvent = (event: Event) => {
    navigate(`/admin/event/${event.id}/tickets/advanced`);
  };

  const handleBackToSelector = () => {
    navigate('/admin/tickets/advanced');
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Event Selector View
  if (!eventId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-page-title">Advanced Ticket Types</h1>
          <p className="text-muted-foreground mt-1">
            Select an event to manage advanced ticket types, packages, and reserved seating
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No events found matching your search" : "No events available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary"
                    onClick={() => handleSelectEvent(event)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base line-clamp-2">{event.title}</CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {event.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      {event.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        Manage Tickets
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ticket Management View (when event is selected)
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBackToSelector}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title">Advanced Ticket Types</h1>
          <p className="text-muted-foreground mt-1">
            Create group packages, bundles, donations, and reserved seating
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Ticket Package</DialogTitle>
            </DialogHeader>
            <CreatePackageForm
              onSubmit={handleCreatePackage}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="seating">Reserved Seating</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading packages...</div>
          ) : packages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">No packages yet</p>
                <p className="text-muted-foreground mb-4">
                  Create your first ticket package to get started
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Package
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {getTypeIcon(pkg.type)}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {pkg.type}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePackage(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {pkg.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold">
                        ${pkg.price?.toFixed(2) || "Pay what you want"}
                      </span>
                    </div>
                    {pkg.quantity && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-semibold">
                          {pkg.quantity - pkg.soldQuantity} / {pkg.quantity}
                        </span>
                      </div>
                    )}
                    {pkg.soldQuantity > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Sold:</span>
                        <span className="font-semibold">{pkg.soldQuantity}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Badge variant={pkg.isActive ? "default" : "secondary"}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="seating" className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Armchair className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Reserved Seating</p>
              <p className="text-muted-foreground">
                Reserved seating management will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Create Package Form Component
const CreatePackageForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Partial<TicketPackage>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<TicketPackage>>({
    type: "group",
    isDonation: false,
    hasReservedSeating: false,
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Package Name *</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., VIP Group Package"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the package benefits..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="type">Package Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: "group" | "bundle" | "donation") =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="group">Group Package</SelectItem>
              <SelectItem value="bundle">Bundle</SelectItem>
              <SelectItem value="donation">Donation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.type !== "donation" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Total Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) })
                  }
                  placeholder="Unlimited"
                />
              </div>
            </div>

            {formData.type === "group" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minQuantity">Min Group Size</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    value={formData.minQuantity || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, minQuantity: parseInt(e.target.value) })
                    }
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="maxQuantity">Max Group Size</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    value={formData.maxQuantity || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, maxQuantity: parseInt(e.target.value) })
                    }
                    placeholder="10"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {formData.type === "donation" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minDonation">Min Donation ($)</Label>
              <Input
                id="minDonation"
                type="number"
                step="0.01"
                value={formData.minDonation || ""}
                onChange={(e) =>
                  setFormData({ ...formData, minDonation: parseFloat(e.target.value) })
                }
                placeholder="5.00"
              />
            </div>
            <div>
              <Label htmlFor="maxDonation">Max Donation ($)</Label>
              <Input
                id="maxDonation"
                type="number"
                step="0.01"
                value={formData.maxDonation || ""}
                onChange={(e) =>
                  setFormData({ ...formData, maxDonation: parseFloat(e.target.value) })
                }
                placeholder="1000.00"
              />
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasReservedSeating"
            checked={formData.hasReservedSeating}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, hasReservedSeating: !!checked })
            }
          />
          <Label htmlFor="hasReservedSeating" className="cursor-pointer">
            Enable Reserved Seating
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: !!checked })
            }
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Active (available for purchase)
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Package</Button>
      </div>
    </form>
  );
};

export default AdminAdvancedTicketTypes;
