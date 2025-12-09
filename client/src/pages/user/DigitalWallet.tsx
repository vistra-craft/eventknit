/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet as WalletIcon, Trash2, Settings, Apple, CreditCard, CheckCircle } from "lucide-react";
import {
  getWallet,
  addTicketToWallet,
  removeTicketFromWallet,
  updateWalletPreferences,
  generateAppleWalletPass,
  generateGooglePayPass,
} from "@/lib/user-dashboard-api";
import { useToast } from "@/hooks/use-toast";

interface WalletTicket {
  id: string;
  registrationId: string;
  backupCode: string;
  isActive: boolean;
  addedAt: string;
  lastAccessedAt?: string;
  registration: {
    id: string;
    event: {
      id: string;
      title: string;
      startDate: string;
      endDate?: string;
      location: string;
      image?: string;
    };
  };
}

interface Wallet {
  id: string;
  userId: string;
  autoAddTickets: boolean;
  backupEnabled: boolean;
  appleWalletId?: string;
  googlePayId?: string;
  lastSyncedAt?: string;
  walletTickets: WalletTicket[];
}

const DigitalWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getWallet();
      if (response.success && response.data) {
        setWallet(response.data.wallet);
      }
    } catch (error) {
      console.error("Error loading wallet:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleAddTicket = async (registrationId: string) => {
    try {
      const response = await addTicketToWallet(registrationId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Ticket added to wallet successfully",
        });
        setIsAddDialogOpen(false);
        loadWallet();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add ticket to wallet",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTicket = async (registrationId: string) => {
    if (!confirm("Are you sure you want to remove this ticket from your wallet?")) return;

    try {
      const response = await removeTicketFromWallet(registrationId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Ticket removed from wallet",
        });
        loadWallet();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove ticket",
        variant: "destructive",
      });
    }
  };

  const handleGenerateApplePass = async (registrationId: string) => {
    try {
      const response = await generateAppleWalletPass(registrationId);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "Apple Wallet pass generated. Download link available.",
        });
        // In production, trigger download or redirect to pass URL
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Apple Wallet pass",
        variant: "destructive",
      });
    }
  };

  const handleGenerateGooglePass = async (registrationId: string) => {
    try {
      const response = await generateGooglePayPass(registrationId);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "Google Pay pass generated. Save link available.",
        });
        window.open(response.data.saveUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Google Pay pass",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePreferences = async (preferences: {
    autoAddTickets?: boolean;
    backupEnabled?: boolean;
  }) => {
    try {
      const response = await updateWalletPreferences(preferences);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "Wallet preferences updated",
        });
        setWallet(response.data.wallet);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Digital Wallet</h1>
          <p className="text-muted-foreground mt-1">
            Store and manage your tickets
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveTab("settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <WalletIcon className="h-4 w-4 mr-2" />
              Add Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ticket to Wallet</DialogTitle>
            </DialogHeader>
            <AddTicketForm
              onSubmit={handleAddTicket}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
          </div>
      </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading wallet...</div>
            ) : !wallet || wallet.walletTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <WalletIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tickets in your wallet yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wallet.walletTickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">
                        {ticket.registration.event.title}
                      </CardTitle>
                      {ticket.isActive && (
                        <Badge variant="default" className="w-fit">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          <p>Backup Code: {ticket.backupCode}</p>
                          <p className="mt-1">
                            Added: {new Date(ticket.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateApplePass(ticket.registrationId)}
                          >
                            <Apple className="h-4 w-4 mr-1" />
                            Apple
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateGooglePass(ticket.registrationId)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Google
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveTicket(ticket.registrationId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {wallet && (
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-add Tickets</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically add new tickets to wallet
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={wallet.autoAddTickets}
                      onChange={(e) =>
                        handleUpdatePreferences({ autoAddTickets: e.target.checked })
                      }
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Backup Enabled</p>
                      <p className="text-sm text-muted-foreground">
                        Enable cloud backup for tickets
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={wallet.backupEnabled}
                      onChange={(e) =>
                        handleUpdatePreferences({ backupEnabled: e.target.checked })
                      }
                      className="rounded"
                    />
                  </div>
                  {wallet.lastSyncedAt && (
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                      Last synced: {new Date(wallet.lastSyncedAt).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
};

const AddTicketForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (registrationId: string) => void;
  onCancel: () => void;
}) => {
  const [registrationId, setRegistrationId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(registrationId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="registrationId">Registration ID *</Label>
        <Input
          id="registrationId"
          value={registrationId}
          onChange={(e) => setRegistrationId(e.target.value)}
          required
          placeholder="Enter registration ID"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add to Wallet</Button>
      </div>
    </form>
  );
};

export default DigitalWallet;

