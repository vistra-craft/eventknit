/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrganizerLayout from "./OrganizerLayout";
import {
  Ticket,
  Plus,
  Trash2,
  Users,
  Gift,
  Heart,
  Armchair,
} from "lucide-react";
import {
  createTicketPackage,
  getEventTicketPackages,
  getReservedSeating,
  deleteTicketPackage,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";
import { useParams } from "react-router-dom";

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

const AdvancedTicketTypes = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [packages, setPackages] = useState<TicketPackage[]>([]);
  interface ReservedSeating {
    id: string;
    name?: string;
    soldQuantity?: number;
    quantity?: number | null;
    seatingChart?: unknown;
  }

  const [reservedSeating, setReservedSeating] = useState<ReservedSeating[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("packages");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

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

  if (!eventId) {
    return (
      <OrganizerLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Event ID is required</p>
          </CardContent>
        </Card>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Advanced Ticket Types</h1>
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
                  <p className="text-muted-foreground">No packages yet</p>
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
                        {!pkg.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {pkg.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pkg.type === "group" && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Quantity: </span>
                            <span className="font-semibold">
                              {pkg.minQuantity}-{pkg.maxQuantity}
                            </span>
                          </div>
                        )}
                        {pkg.type === "donation" && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Range: </span>
                            <span className="font-semibold">
                              {pkg.minDonation ? `$${pkg.minDonation}` : "$0"} -{" "}
                              {pkg.maxDonation ? `$${pkg.maxDonation}` : "Unlimited"}
                            </span>
                          </div>
                        )}
                        {pkg.price !== undefined && pkg.price !== null && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Price: </span>
                            <span className="font-semibold">${pkg.price}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Sold:</span>
                          <span className="font-semibold">
                            {pkg.soldQuantity} / {pkg.quantity || "∞"}
                          </span>
                        </div>
                        {pkg.hasReservedSeating && (
                          <Badge variant="secondary" className="gap-1">
                            <Armchair className="h-3 w-3" />
                            Reserved Seating
                          </Badge>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePackage(pkg.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="seating" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading seating...</div>
            ) : reservedSeating.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Armchair className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reserved seating configured</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reservedSeating.map((seating, index) => (
                  <Card key={seating.id || `seating-${index}`}>
                    <CardHeader>
                      <CardTitle>{seating.name || "Reserved Seating"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        Sold: {seating.soldQuantity ?? 0} / {seating.quantity ?? "∞"}
                      </div>
                      {seating.seatingChart ? (
                        <div className="mt-4">
                          <p className="text-sm font-semibold mb-2">Seating Chart</p>
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                            {JSON.stringify(seating.seatingChart, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </OrganizerLayout>
  );
};

const CreatePackageForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Partial<TicketPackage>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "group" as "group" | "bundle" | "donation",
    price: "",
    minQuantity: "",
    maxQuantity: "",
    isDonation: false,
    minDonation: "",
    maxDonation: "",
    hasReservedSeating: false,
    quantity: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<TicketPackage> = {
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      hasReservedSeating: formData.hasReservedSeating,
    };

    if (formData.type === "group") {
      data.minQuantity = parseInt(formData.minQuantity);
      data.maxQuantity = parseInt(formData.maxQuantity);
      data.price = formData.price ? parseFloat(formData.price) : undefined;
    } else if (formData.type === "bundle") {
      data.price = parseFloat(formData.price);
    } else if (formData.type === "donation") {
      data.isDonation = true;
      data.minDonation = formData.minDonation ? parseFloat(formData.minDonation) : undefined;
      data.maxDonation = formData.maxDonation ? parseFloat(formData.maxDonation) : undefined;
      // suggestedAmounts not supported by payload; ignore
    }

    if (formData.quantity) {
      data.quantity = parseInt(formData.quantity);
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Package Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Group Package"
        />
      </div>
      <div>
        <Label htmlFor="type">Package Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value: TicketPackage["type"]) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="group">Group Package</SelectItem>
            <SelectItem value="bundle">Bundle Package</SelectItem>
            <SelectItem value="donation">Donation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      {formData.type === "group" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minQuantity">Min Quantity *</Label>
              <Input
                id="minQuantity"
                type="number"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="maxQuantity">Max Quantity *</Label>
              <Input
                id="maxQuantity"
                type="number"
                value={formData.maxQuantity}
                onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="price">Price per Ticket</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
        </>
      )}

      {formData.type === "bundle" && (
        <div>
          <Label htmlFor="price">Bundle Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
      )}

      {formData.type === "donation" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minDonation">Min Donation</Label>
              <Input
                id="minDonation"
                type="number"
                step="0.01"
                value={formData.minDonation}
                onChange={(e) => setFormData({ ...formData, minDonation: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="maxDonation">Max Donation</Label>
              <Input
                id="maxDonation"
                type="number"
                step="0.01"
                value={formData.maxDonation}
                onChange={(e) => setFormData({ ...formData, maxDonation: e.target.value })}
              />
            </div>
          </div>
          {/* Suggested amounts not supported by payload */}
        </>
      )}

      <div>
        <Label htmlFor="quantity">Available Quantity</Label>
        <Input
          id="quantity"
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          placeholder="Leave empty for unlimited"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="hasReservedSeating"
          checked={formData.hasReservedSeating}
          onChange={(e) =>
            setFormData({ ...formData, hasReservedSeating: e.target.checked })
          }
          className="rounded"
        />
        <Label htmlFor="hasReservedSeating">Has Reserved Seating</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Package</Button>
      </div>
    </form>
  );
};

export default AdvancedTicketTypes;

