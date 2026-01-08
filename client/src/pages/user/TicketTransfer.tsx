/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, X, CheckCircle, Clock, User, Calendar, MapPin } from "lucide-react";
import { getUserRegisteredEvents } from "@/lib/event-api";
import { initiateTicketTransfer, getTransferHistory, cancelTicketTransfer } from "@/lib/user-dashboard-api";
import { useToast } from "@/hooks/useToast";

const TicketTransfer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [, setSelectedEvent] = useState<any>(null);
  const [transferData, setTransferData] = useState({
    toEmail: "",
    message: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsResponse, historyResponse] = await Promise.all([
        getUserRegisteredEvents({ page: 1, limit: 50 }),
        getTransferHistory({ page: 1, limit: 20 }),
      ]);

      if (eventsResponse.success && eventsResponse.data) {
        setUserEvents(eventsResponse.data.events || []);
      }

      if (historyResponse.success && historyResponse.data) {
        setTransferHistory(historyResponse.data.transfers || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (registrationId: string) => {
    if (!transferData.toEmail) {
      toast({
        title: "Error",
        description: "Please enter recipient email",
        variant: "destructive",
      });
      return;
    }

    try {
      setTransferring(true);
      const response = await initiateTicketTransfer(registrationId, {
        toEmail: transferData.toEmail,
        message: transferData.message,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Transfer initiated successfully. Recipient will receive an email.",
        });
        setTransferData({ toEmail: "", message: "" });
        setSelectedEvent(null);
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate transfer",
        variant: "destructive",
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    try {
      const response = await cancelTicketTransfer(transferId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Transfer cancelled successfully",
        });
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel transfer",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      PENDING: { label: "Pending", variant: "secondary", icon: Clock },
      ACCEPTED: { label: "Accepted", variant: "default", icon: CheckCircle },
      REJECTED: { label: "Rejected", variant: "destructive", icon: X },
      CANCELLED: { label: "Cancelled", variant: "outline", icon: X },
      EXPIRED: { label: "Expired", variant: "outline", icon: Clock },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const transferableEvents = userEvents.filter(
    (event) => new Date(event.date) > new Date() && event.status === "confirmed"
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Ticket Transfer</h1>
        <p className="text-muted-foreground">
          Transfer your tickets to other users or view your transfer history
        </p>
      </div>

      <Tabs defaultValue="transfer" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transfer">Transfer Ticket</TabsTrigger>
          <TabsTrigger value="history">Transfer History</TabsTrigger>
        </TabsList>

        <TabsContent value="transfer" className="space-y-6">
          {transferableEvents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No transferable tickets found. You can only transfer tickets for upcoming events.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transferableEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          onClick={() => setSelectedEvent(event)}
                        >
                          Transfer Ticket
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Transfer Ticket</DialogTitle>
                          <DialogDescription>
                            Transfer your ticket for "{event.title}" to another user
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="toEmail">Recipient Email</Label>
                            <Input
                              id="toEmail"
                              type="email"
                              placeholder="recipient@example.com"
                              value={transferData.toEmail}
                              onChange={(e) =>
                                setTransferData({ ...transferData, toEmail: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="message">Message (Optional)</Label>
                            <Textarea
                              id="message"
                              placeholder="Add a personal message..."
                              value={transferData.message}
                              onChange={(e) =>
                                setTransferData({ ...transferData, message: e.target.value })
                              }
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => handleTransfer(event.registrationId || event.id)}
                            disabled={transferring}
                          >
                            {transferring ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Transferring...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Initiate Transfer
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {transferHistory.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No transfer history found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transferHistory.map((transfer) => (
                <Card key={transfer.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {transfer.registration?.event?.title || "Event"}
                          </h3>
                          {getStatusBadge(transfer.status)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                              To: {transfer.toUser?.email || transfer.toEmail || "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(transfer.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {transfer.message && (
                            <p className="mt-2 text-foreground">{transfer.message}</p>
                          )}
                        </div>
                      </div>
                      {transfer.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelTransfer(transfer.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
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

export default TicketTransfer;
