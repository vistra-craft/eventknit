/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Bell,
  BellOff,
  Plus,
  Settings,
  CheckCircle,
} from "lucide-react";
import {
  subscribeToEvent,
  unsubscribeFromEvent,
  getUserSubscriptions,
  updateSubscriptionPreferences,
} from "@/lib/user-dashboard-api";
import { useToast } from "@/hooks/useToast";

interface Subscription {
  id: string;
  eventId: string;
  updateTypes: string[];
  channels: string[];
  isActive: boolean;
  subscribedAt: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate?: string;
    location: string;
    image?: string;
    status: string;
  };
}

const EventUpdatesSubscription = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await getUserSubscriptions(true);
      if (response.success && response.data) {
        setSubscriptions(response.data.subscriptions || []);
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (data: {
    eventId: string;
    updateTypes?: string[];
    channels?: string[];
  }) => {
    try {
      const response = await subscribeToEvent(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Subscribed to event updates successfully",
        });
        setIsSubscribeDialogOpen(false);
        loadSubscriptions();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe",
        variant: "destructive",
      });
    }
  };

  const handleUnsubscribe = async (eventId: string) => {
    if (!confirm("Are you sure you want to unsubscribe from this event?")) return;

    try {
      const response = await unsubscribeFromEvent(eventId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Unsubscribed from event updates",
        });
        loadSubscriptions();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unsubscribe",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePreferences = async (eventId: string, preferences: {
    updateTypes?: string[];
    channels?: string[];
  }) => {
    try {
      const response = await updateSubscriptionPreferences(eventId, preferences);
      if (response.success) {
        toast({
          title: "Success",
          description: "Subscription preferences updated",
        });
        setSelectedSubscription(null);
        loadSubscriptions();
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
          <h1 className="text-3xl font-bold">Event Updates Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Subscribe to updates from your favorite events
          </p>
        </div>
        <Dialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Subscribe to Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subscribe to Event Updates</DialogTitle>
              </DialogHeader>
              <SubscribeForm
                onSubmit={handleSubscribe}
                onCancel={() => setIsSubscribeDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active subscriptions yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{subscription.event.title}</CardTitle>
                      <Badge variant="default" className="mt-2 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Subscribed
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Update Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {subscription.updateTypes.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Channels:</p>
                      <div className="flex flex-wrap gap-1">
                        {subscription.channels.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Subscribed: {new Date(subscription.subscribedAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSubscription(subscription)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnsubscribe(subscription.eventId)}
                      >
                        <BellOff className="h-4 w-4 mr-1" />
                        Unsubscribe
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedSubscription && (
          <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subscription Preferences</DialogTitle>
              </DialogHeader>
              <SubscriptionPreferencesForm
                subscription={selectedSubscription}
                onSubmit={(preferences) =>
                  handleUpdatePreferences(selectedSubscription.eventId, preferences)
                }
                onCancel={() => setSelectedSubscription(null)}
              />
            </DialogContent>
          </Dialog>
        )}
    </div>
  );
};

const SubscribeForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { eventId: string; updateTypes?: string[]; channels?: string[] }) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    eventId: "",
    updateTypes: ["SCHEDULE", "VENUE", "CANCELLATION", "ANNOUNCEMENT"] as string[],
    channels: ["EMAIL", "PUSH", "IN_APP"] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleUpdateType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      updateTypes: prev.updateTypes.includes(type)
        ? prev.updateTypes.filter((t) => t !== type)
        : [...prev.updateTypes, type],
    }));
  };

  const toggleChannel = (channel: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="eventId">Event ID *</Label>
        <Input
          id="eventId"
          value={formData.eventId}
          onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
          required
          placeholder="Enter event ID"
        />
      </div>
      <div>
        <Label>Update Types</Label>
        <div className="space-y-2 mt-2">
          {["SCHEDULE", "VENUE", "CANCELLATION", "ANNOUNCEMENT", "OTHER"].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`type-${type}`}
                checked={formData.updateTypes.includes(type)}
                onChange={() => toggleUpdateType(type)}
                className="rounded"
              />
              <Label htmlFor={`type-${type}`} className="cursor-pointer">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Notification Channels</Label>
        <div className="space-y-2 mt-2">
          {["EMAIL", "PUSH", "IN_APP", "SMS"].map((channel) => (
            <div key={channel} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`channel-${channel}`}
                checked={formData.channels.includes(channel)}
                onChange={() => toggleChannel(channel)}
                className="rounded"
              />
              <Label htmlFor={`channel-${channel}`} className="cursor-pointer">
                {channel}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Subscribe</Button>
      </div>
    </form>
  );
};

const SubscriptionPreferencesForm = ({
  subscription,
  onSubmit,
  onCancel,
}: {
  subscription: Subscription;
  onSubmit: (preferences: { updateTypes?: string[]; channels?: string[] }) => void;
  onCancel: () => void;
}) => {
  const [updateTypes, setUpdateTypes] = useState(subscription.updateTypes);
  const [channels, setChannels] = useState(subscription.channels);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ updateTypes, channels });
  };

  const toggleUpdateType = (type: string) => {
    setUpdateTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleChannel = (channel: string) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Update Types</Label>
        <div className="space-y-2 mt-2">
          {["SCHEDULE", "VENUE", "CANCELLATION", "ANNOUNCEMENT", "OTHER"].map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`pref-type-${type}`}
                checked={updateTypes.includes(type)}
                onChange={() => toggleUpdateType(type)}
                className="rounded"
              />
              <Label htmlFor={`pref-type-${type}`} className="cursor-pointer">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Notification Channels</Label>
        <div className="space-y-2 mt-2">
          {["EMAIL", "PUSH", "IN_APP", "SMS"].map((channel) => (
            <div key={channel} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`pref-channel-${channel}`}
                checked={channels.includes(channel)}
                onChange={() => toggleChannel(channel)}
                className="rounded"
              />
              <Label htmlFor={`pref-channel-${channel}`} className="cursor-pointer">
                {channel}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Update Preferences</Button>
      </div>
    </form>
  );
};

export default EventUpdatesSubscription;

