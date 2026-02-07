/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Ticket,
  Plus,
  ShoppingCart,
  X,
  Calendar,
  MapPin,
} from "lucide-react";
import {
  listTicketForResale,
  getMarketplaceTickets,
  getUserResales,
  purchaseResaleTicket,
  cancelResale,
} from "@/lib/user-dashboard-api";
import { useToast } from "@/hooks/useToast";

interface ResaleTicket {
  id: string;
  registrationId: string;
  sellerId: string;
  originalPrice: number;
  resalePrice: number;
  currency: string;
  status: string;
  listedAt: string;
  expiresAt?: string;
  registration: {
    event: {
      id: string;
      title: string;
      startDate: string;
      endDate?: string;
      location: string;
      image?: string;
    };
  };
  seller: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

const TicketResale = () => {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [marketplaceTickets, setMarketplaceTickets] = useState<ResaleTicket[]>([]);
  const [myResales, setMyResales] = useState<ResaleTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === "marketplace") {
        const response = await getMarketplaceTickets();
        if (response.success && response.data) {
          setMarketplaceTickets((response.data.tickets || []) as unknown as ResaleTicket[]);
        }
      } else if (activeTab === "my-listings") {
        const response = await getUserResales();
        if (response.success && response.data) {
          setMyResales((response.data.resales || []) as unknown as ResaleTicket[]);
        }
      }
    } catch (error) {
      console.error("Error loading resale data:", error);
      toast({
        title: "Error",
        description: "Failed to load resale tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleListTicket = async (data: {
    registrationId: string;
    resalePrice: number;
    expiresAt?: string;
  }) => {
    try {
      const response = await listTicketForResale(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Ticket listed for resale successfully",
        });
        setIsListDialogOpen(false);
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to list ticket",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async (resaleId: string) => {
    if (!confirm("Are you sure you want to purchase this ticket?")) return;

    try {
      const response = await purchaseResaleTicket(resaleId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Ticket purchased successfully",
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase ticket",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (resaleId: string) => {
    if (!confirm("Are you sure you want to cancel this listing?")) return;

    try {
      const response = await cancelResale(resaleId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Listing cancelled successfully",
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel listing",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      LISTED: { variant: "default" as const, label: "Listed" },
      SOLD: { variant: "outline" as const, label: "Sold" },
      CANCELLED: { variant: "outline" as const, label: "Cancelled" },
      EXPIRED: { variant: "outline" as const, label: "Expired" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ticket Resale Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              Buy and sell event tickets
            </p>
          </div>
          {activeTab === "my-listings" && (
            <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  List Ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>List Ticket for Resale</DialogTitle>
                </DialogHeader>
                <ListTicketForm
                  onSubmit={handleListTicket}
                  onCancel={() => setIsListDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="my-listings">My Listings</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading marketplace...</div>
            ) : marketplaceTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tickets available for resale</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketplaceTickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">
                          {ticket.registration.event.title}
                        </CardTitle>
                        {getStatusBadge(ticket.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(ticket.registration.event.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">
                            {ticket.registration.event.location}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Original Price</p>
                            <p className="text-sm line-through">
                              {formatCurrency(Number(ticket.originalPrice), ticket.currency)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Resale Price</p>
                            <p className="text-lg font-bold text-success">
                              {formatCurrency(Number(ticket.resalePrice), ticket.currency)}
                            </p>
                          </div>
                        </div>
                        {ticket.status === "LISTED" && (
                          <Button
                            className="w-full"
                            onClick={() => handlePurchase(ticket.id)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Purchase
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-listings" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading your listings...</div>
            ) : myResales.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You haven't listed any tickets yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myResales.map((resale) => (
                  <Card key={resale.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{resale.registration.event.title}</h3>
                            {getStatusBadge(resale.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Original: </span>
                              <span className="line-through">
                                {formatCurrency(Number(resale.originalPrice), resale.currency)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Resale: </span>
                              <span className="font-semibold text-success">
                                {formatCurrency(Number(resale.resalePrice), resale.currency)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Listed: </span>
                              <span>{new Date(resale.listedAt).toLocaleDateString()}</span>
                            </div>
                            {resale.expiresAt && (
                              <div>
                                <span className="text-muted-foreground">Expires: </span>
                                <span>{new Date(resale.expiresAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {resale.status === "LISTED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(resale.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
};

const ListTicketForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { registrationId: string; resalePrice: number; expiresAt?: string }) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    registrationId: "",
    resalePrice: "",
    expiresAt: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      registrationId: formData.registrationId,
      resalePrice: parseFloat(formData.resalePrice),
      expiresAt: formData.expiresAt || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="registrationId">Registration ID *</Label>
        <Input
          id="registrationId"
          value={formData.registrationId}
          onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
          required
          placeholder="Enter registration ID"
        />
      </div>
      <div>
        <Label htmlFor="resalePrice">Resale Price *</Label>
        <Input
          id="resalePrice"
          type="number"
          step="0.01"
          value={formData.resalePrice}
          onChange={(e) => setFormData({ ...formData, resalePrice: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={formData.expiresAt}
          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">List Ticket</Button>
      </div>
    </form>
  );
};

export default TicketResale;
