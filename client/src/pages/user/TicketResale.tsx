/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  initializeResalePayment,
  verifyResalePayment,
  cancelResale,
} from "@/lib/user-dashboard-api";
import { getUserRegisteredEvents } from "@/lib/event-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import { useAuthContext } from "@/hooks/useAuthContext";

// Paystack popup type
declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

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
    ticketType?: string;
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

interface UserTicket {
  id: string;
  title: string;
  registrationId?: string;
  ticketType?: string;
  status?: string;
}

const TicketResale = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state: authState } = useAuthContext();
  const [activeTab, setActiveTab] = useState("marketplace");
  const [marketplaceTickets, setMarketplaceTickets] = useState<ResaleTicket[]>([]);
  const [myResales, setMyResales] = useState<ResaleTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const { toast } = useToast();

  // Pre-select from location.state (e.g., from MyTickets page)
  const preselectedRegistrationId = (location.state as { registrationId?: string } | null)?.registrationId;

  // Load Paystack script
  useEffect(() => {
    if (document.getElementById('paystack-script')) {
      setPaystackLoaded(!!window.PaystackPop);
      return;
    }
    const script = document.createElement('script');
    script.id = 'paystack-script';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Handle redirect-based payment verification
  useEffect(() => {
    const verifyRef = searchParams.get('verifyPayment');
    if (verifyRef) {
      handleVerifyPayment(verifyRef);
    }
  }, []);

  // Pre-select from location.state
  useEffect(() => {
    if (preselectedRegistrationId) {
      setActiveTab("my-listings");
      setIsListDialogOpen(true);
    }
  }, [preselectedRegistrationId]);

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
      showErrorToast(toast, error, "Failed to load resale tickets");
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
        toast({ title: "Success", description: "Ticket listed for resale successfully" });
        setIsListDialogOpen(false);
        loadData();
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to list ticket");
    }
  };

  const handleVerifyPayment = async (reference: string) => {
    try {
      const response = await verifyResalePayment(reference);
      if (response.success) {
        toast({ title: "Success", description: "Ticket purchased successfully!" });
        loadData();
      } else {
        toast({ title: "Verification failed", description: response.message || "Payment verification failed", variant: "destructive" });
      }
    } catch (error) {
      showErrorToast(toast, error, "Payment verification failed");
    }
  };

  const handlePurchase = useCallback(async (resaleId: string, resalePrice: number, currency: string) => {
    setPurchasingId(resaleId);

    try {
      const response = await initializeResalePayment(resaleId);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to initialize payment');
      }

      const { reference } = response.data;
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      const email = authState.user?.email || '';

      if (publicKey && window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email,
          amount: Math.round(resalePrice * 100), // Convert to kobo/cents
          currency,
          ref: reference,
          callback: async (callbackResponse) => {
            await handleVerifyPayment(callbackResponse.reference);
            setPurchasingId(null);
          },
          onClose: () => {
            setPurchasingId(null);
            toast({ title: "Payment Cancelled", description: "You can try again anytime" });
          },
        });
        handler.openIframe();
      } else if (response.data.authorizationUrl) {
        // Fallback: redirect to Paystack
        window.location.href = response.data.authorizationUrl;
      } else {
        throw new Error('Payment processor not ready');
      }
    } catch (error) {
      showErrorToast(toast, error, "Payment failed", "Failed to start payment");
      setPurchasingId(null);
    }
  }, [authState.user?.email, paystackLoaded]);

  const handleCancel = async (resaleId: string) => {
    try {
      const response = await cancelResale(resaleId);
      if (response.success) {
        toast({ title: "Success", description: "Listing cancelled successfully" });
        loadData();
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to cancel listing");
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      LISTED: { variant: "default" as const, label: "Listed" },
      RESERVED: { variant: "outline" as const, label: "Reserved" },
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
          <p className="text-muted-foreground mt-1">Buy and sell event tickets</p>
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
                preselectedRegistrationId={preselectedRegistrationId}
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
                        <span>{new Date(ticket.registration.event.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{ticket.registration.event.location}</span>
                      </div>
                      {ticket.registration.ticketType && (
                        <p className="text-xs text-muted-foreground">
                          Type: {ticket.registration.ticketType}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Original</p>
                          <p className="text-sm line-through">
                            {formatCurrency(Number(ticket.originalPrice), ticket.currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Resale</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(Number(ticket.resalePrice), ticket.currency)}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Seller: {ticket.seller.firstName} {ticket.seller.lastName?.charAt(0)}.
                      </div>
                      {ticket.status === "LISTED" && (
                        <Button
                          className="w-full"
                          disabled={purchasingId === ticket.id}
                          onClick={() => handlePurchase(ticket.id, Number(ticket.resalePrice), ticket.currency)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {purchasingId === ticket.id ? "Processing..." : "Purchase"}
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
                            <span className="font-semibold text-primary">
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
                        <Button variant="outline" size="sm" onClick={() => setCancelConfirm(resale.id)}>
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

      <AlertDialog open={!!cancelConfirm} onOpenChange={() => setCancelConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel listing?</AlertDialogTitle>
            <AlertDialogDescription>This will remove your ticket from the resale marketplace.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep listing</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (cancelConfirm) { handleCancel(cancelConfirm); } setCancelConfirm(null); }}>Cancel listing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ListTicketForm = ({
  onSubmit,
  onCancel,
  preselectedRegistrationId,
}: {
  onSubmit: (data: { registrationId: string; resalePrice: number; expiresAt?: string }) => void;
  onCancel: () => void;
  preselectedRegistrationId?: string;
}) => {
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(preselectedRegistrationId || "");
  const [resalePrice, setResalePrice] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await getUserRegisteredEvents({ page: 1, limit: 100 });
        if (response.success && response.data) {
          const eligible = response.data.events
            .filter((e) => e.status === 'upcoming' && e.registrationId)
            .map((e) => ({
              id: e.id,
              title: e.title,
              registrationId: e.registrationId,
              ticketType: e.ticketType,
              status: e.status,
            }));
          setTickets(eligible);
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoadingTickets(false);
      }
    };
    fetchTickets();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegistrationId || !resalePrice) return;
    onSubmit({
      registrationId: selectedRegistrationId,
      resalePrice: parseFloat(resalePrice),
      expiresAt: expiresAt || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="ticket">Select Ticket *</Label>
        {loadingTickets ? (
          <p className="text-sm text-muted-foreground py-2">Loading your tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No eligible tickets to list for resale</p>
        ) : (
          <select
            id="ticket"
            value={selectedRegistrationId}
            onChange={(e) => setSelectedRegistrationId(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a ticket...</option>
            {tickets.map((ticket) => (
              <option key={ticket.registrationId} value={ticket.registrationId}>
                {ticket.title}{ticket.ticketType ? ` — ${ticket.ticketType}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <Label htmlFor="resalePrice">Resale Price *</Label>
        <Input
          id="resalePrice"
          type="number"
          step="0.01"
          min="0"
          value={resalePrice}
          onChange={(e) => setResalePrice(e.target.value)}
          required
          placeholder="Enter your asking price"
        />
      </div>
      <div>
        <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!selectedRegistrationId || !resalePrice || loadingTickets}>
          List Ticket
        </Button>
      </div>
    </form>
  );
};

export default TicketResale;
