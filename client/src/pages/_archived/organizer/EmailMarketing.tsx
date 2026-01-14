import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrganizerLayout from "./OrganizerLayout";
import {
  Mail,
  Plus,
  Send,
  BarChart3,
  Clock,
} from "lucide-react";
import {
  createEmailCampaign,
  getEmailCampaigns,
  sendEmailCampaign,
  getCampaignAnalytics,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  createdAt: string;
}

interface CampaignAnalytics {
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
}

type CreateCampaignPayload = {
  eventId?: string;
  name: string;
  subject: string;
  content: string;
  plainText?: string;
  recipientType: "all" | "segment" | "tag" | "event_registrations";
  segmentId?: string;
  tagId?: string;
  scheduledAt?: string;
};

const EmailMarketing = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getEmailCampaigns();
      if (response.success && response.data) {
        setCampaigns(response.data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async (data: CreateCampaignPayload) => {
    try {
      const response = await createEmailCampaign(data);
      if (response.success) {
        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
        setIsCreateDialogOpen(false);
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to send this campaign?")) return;

    try {
      const response = await sendEmailCampaign(campaignId);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Campaign sent to ${response.data.sentCount} recipients`,
        });
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    }
  };

  const loadCampaignAnalytics = async (campaignId: string) => {
    try {
      const response = await getCampaignAnalytics(campaignId);
      if (response.success && response.data) {
        setCampaignAnalytics(response.data);
        setIsAnalyticsDialogOpen(true);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "outline" | "default" | "destructive"; label: string }
    > = {
      draft: { variant: "outline", label: "Draft" },
      scheduled: { variant: "default", label: "Scheduled" },
      sending: { variant: "default", label: "Sending" },
      sent: { variant: "default", label: "Sent" },
      cancelled: { variant: "outline", label: "Cancelled" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Email Marketing</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage email campaigns
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Campaign</DialogTitle>
              </DialogHeader>
              <CreateCampaignForm
                onSubmit={handleCreateCampaign}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No campaigns yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {campaign.subject}
                      </p>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sent:</span>
                        <span className="ml-1 font-semibold">{campaign.sentCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Opened:</span>
                        <span className="ml-1 font-semibold">{campaign.openedCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clicked:</span>
                        <span className="ml-1 font-semibold">{campaign.clickedCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bounced:</span>
                        <span className="ml-1 font-semibold text-destructive">
                          {campaign.bouncedCount}
                        </span>
                      </div>
                    </div>
                    {campaign.scheduledAt && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadCampaignAnalytics(campaign.id)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analytics
                      </Button>
                      {campaign.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handleSendCampaign(campaign.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {campaignAnalytics && (
          <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Campaign Analytics</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Delivery Rate</div>
                      <div className="text-2xl font-bold">
                        {campaignAnalytics.rates.deliveryRate.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Open Rate</div>
                      <div className="text-2xl font-bold">
                        {campaignAnalytics.rates.openRate.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Click Rate</div>
                      <div className="text-2xl font-bold">
                        {campaignAnalytics.rates.clickRate.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Bounce Rate</div>
                      <div className="text-2xl font-bold text-destructive">
                        {campaignAnalytics.rates.bounceRate.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sent</span>
                    <span className="font-semibold">{campaignAnalytics.metrics.sent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivered</span>
                    <span className="font-semibold">{campaignAnalytics.metrics.delivered}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Opened</span>
                    <span className="font-semibold">{campaignAnalytics.metrics.opened}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Clicked</span>
                    <span className="font-semibold">{campaignAnalytics.metrics.clicked}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </OrganizerLayout>
  );
};

const CreateCampaignForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: CreateCampaignPayload) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
    plainText: "",
    recipientType: "all" as "all" | "segment" | "tag" | "event_registrations",
    segmentId: "",
    tagId: "",
    eventId: "",
    scheduledAt: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      eventId: formData.eventId || undefined,
      segmentId: formData.segmentId || undefined,
      tagId: formData.tagId || undefined,
      plainText: formData.plainText || undefined,
      scheduledAt: formData.scheduledAt || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Welcome Email"
        />
      </div>
      <div>
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="recipientType">Recipient Type *</Label>
        <Select
          value={formData.recipientType}
        onValueChange={(value: CreateCampaignPayload["recipientType"]) =>
          setFormData({ ...formData, recipientType: value })
        }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Attendees</SelectItem>
            <SelectItem value="segment">Segment</SelectItem>
            <SelectItem value="tag">Tag</SelectItem>
            <SelectItem value="event_registrations">Event Registrations</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formData.recipientType === "segment" && (
        <div>
          <Label htmlFor="segmentId">Segment ID *</Label>
          <Input
            id="segmentId"
            value={formData.segmentId}
            onChange={(e) => setFormData({ ...formData, segmentId: e.target.value })}
            required
            placeholder="Enter segment ID"
          />
        </div>
      )}
      {formData.recipientType === "tag" && (
        <div>
          <Label htmlFor="tagId">Tag ID *</Label>
          <Input
            id="tagId"
            value={formData.tagId}
            onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
            required
            placeholder="Enter tag ID"
          />
        </div>
      )}
      {formData.recipientType === "event_registrations" && (
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
      )}
      <div>
        <Label htmlFor="content">HTML Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          rows={8}
          className="font-mono text-sm"
          placeholder="<html>...</html>"
        />
      </div>
      <div>
        <Label htmlFor="plainText">Plain Text (Optional)</Label>
        <Textarea
          id="plainText"
          value={formData.plainText}
          onChange={(e) => setFormData({ ...formData, plainText: e.target.value })}
          rows={4}
          placeholder="Plain text version"
        />
      </div>
      <div>
        <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          value={formData.scheduledAt}
          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Campaign</Button>
      </div>
    </form>
  );
};

export default EmailMarketing;

