/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sparkles,
  RefreshCw,
  X,
  Settings,
  Calendar,
  MapPin,
  TrendingUp,
} from "lucide-react";
import {
  getFeed,
  refreshFeed,
  updateFeedPreferences,
  markFeedItemViewed,
  dismissFeedItem,
} from "@/lib/user-dashboard-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import { useNavigate } from "react-router-dom";

interface FeedItem {
  id: string;
  eventId: string;
  relevanceScore: number;
  reason?: string;
  viewed: boolean;
  dismissed: boolean;
  addedAt: string;
  event: {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location: string;
    category?: string;
    image?: string;
    isFree: boolean;
    price?: number;
    currency?: string;
  };
}

interface Feed {
  id: string;
  userId: string;
  preferences: any;
  filters: any;
  lastUpdated: string;
  feedItems: FeedItem[];
}

const PersonalEventFeed = () => {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getFeed();
      if (response.success && response.data) {
        setFeed(response.data.feed as unknown as Feed);
      }
    } catch (error) {
      console.error("Error loading feed:", error);
      showErrorToast(toast, error, "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await refreshFeed();
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Feed refreshed. ${response.data.itemsAdded} new items added.`,
        });
        loadFeed();
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to refresh feed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkViewed = async (itemId: string) => {
    try {
      await markFeedItemViewed(itemId);
      loadFeed();
    } catch (error) {
      console.error("Error marking item viewed:", error);
    }
  };

  const handleDismiss = async (itemId: string) => {
    try {
      await dismissFeedItem(itemId);
      loadFeed();
    } catch (error) {
      console.error("Error dismissing item:", error);
    }
  };

  const handleUpdatePreferences = async (preferences: { preferences?: any; filters?: any }) => {
    try {
      const response = await updateFeedPreferences(preferences);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "Feed preferences updated",
        });
        setIsSettingsDialogOpen(false);
        setFeed(response.data.feed as unknown as Feed);
      }
    } catch (error) {
      showErrorToast(toast, error, "Failed to update preferences");
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personal Event Feed</h1>
          <p className="text-muted-foreground mt-1">
            Personalized event recommendations just for you
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Feed
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading feed...</div>
        ) : !feed || feed.feedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No events in your feed yet</p>
              <Button className="mt-4" onClick={handleRefresh}>
                Refresh Feed
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feed.feedItems.map((item) => (
              <Card
                key={item.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  item.viewed ? "opacity-60" : ""
                }`}
                onClick={() => {
                  handleMarkViewed(item.id);
                  navigate(`/events/${item.event.id}`);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{item.event.title}</h3>
                        {item.relevanceScore > 0.7 && (
                          <Badge variant="default" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Highly Recommended
                          </Badge>
                        )}
                      </div>
                      {item.reason && (
                        <p className="text-sm text-muted-foreground mb-2">{item.reason}</p>
                      )}
                      {item.event.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {item.event.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(item.event.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{item.event.location}</span>
                        </div>
                        {item.event.price !== undefined && item.event.price !== null && (
                          <div>
                            {item.event.isFree ? (
                              <Badge variant="outline">Free</Badge>
                            ) : (
                              <span>{formatCurrency(Number(item.event.price), item.event.currency || "NGN")}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(item.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {feed && (
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Feed Preferences</DialogTitle>
              </DialogHeader>
              <FeedSettingsForm
                feed={feed}
                onSubmit={handleUpdatePreferences}
                onCancel={() => setIsSettingsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
    </div>
  );
};

const FeedSettingsForm = ({
  feed,
  onSubmit,
  onCancel,
}: {
  feed: Feed;
  onSubmit: (preferences: { preferences?: any; filters?: any }) => void;
  onCancel: () => void;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ preferences: feed.preferences, filters: feed.filters });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Customize your feed preferences. Changes will be applied on next refresh.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Preferences</Button>
      </div>
    </form>
  );
};

export default PersonalEventFeed;

