import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import OrganizerLayout from "./OrganizerLayout";
import { Mail, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  sendToSegment,
  sendToTaggedUsers,
  sendToEventRegistrations,
  getCommunicationHistory,
  getOrganizerSegments,
  getOrganizerTags,
} from "@/lib/organizer-dashboard-api";
import { useToast } from "@/hooks/useToast";

interface CommunicationMessage {
  id: string;
  subject: string;
  content: string;
  recipientType: string;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  event?: { id: string; title: string };
}

const AttendeeCommunication = () => {
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [segments, setSegments] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [recipientType] = useState<"segment" | "tag" | "event">("segment");
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [historyRes, segmentsRes, tagsRes] = await Promise.all([
        getCommunicationHistory(),
        getOrganizerSegments(),
        getOrganizerTags(),
      ]);

      if (historyRes.success && historyRes.data) {
        setMessages(historyRes.data.messages || []);
      }

      if (segmentsRes.success && segmentsRes.data) {
        const segmentList = Array.isArray(segmentsRes.data.segments)
          ? segmentsRes.data.segments
              .map((s) => {
                if (!s || typeof s !== "object") return null;
                const raw = s as Record<string, unknown>;
                const id = raw.id ?? raw.segmentId;
                const name = raw.name ?? raw.segmentName;
                if (!id || !name) return null;
                return { id: String(id), name: String(name) };
              })
              .filter((s): s is { id: string; name: string } => !!s)
          : [];
        setSegments(segmentList);
      }

      if (tagsRes.success && tagsRes.data) {
        const tagList = Array.isArray(tagsRes.data.tags)
          ? tagsRes.data.tags
              .map((t) => {
                if (!t || typeof t !== "object") return null;
                const raw = t as Record<string, unknown>;
                const id = raw.id;
                const name = raw.name;
                if (!id || !name) return null;
                return { id: String(id), name: String(name) };
              })
              .filter((t): t is { id: string; name: string } => !!t)
          : [];
        setTags(tagList);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load communication data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendMessage = async (data: {
    recipientType: "segment" | "tag" | "event";
    recipientId: string;
    subject: string;
    content: string;
    sendEmail?: boolean;
    sendNotification?: boolean;
  }) => {
    try {
      let response;
      if (data.recipientType === "segment") {
        response = await sendToSegment(data.recipientId, {
          subject: data.subject,
          content: data.content,
          sendEmail: data.sendEmail,
          sendNotification: data.sendNotification,
        });
      } else if (data.recipientType === "tag") {
        response = await sendToTaggedUsers(data.recipientId, {
          subject: data.subject,
          content: data.content,
          sendEmail: data.sendEmail,
          sendNotification: data.sendNotification,
        });
      } else {
        response = await sendToEventRegistrations(data.recipientId, {
          subject: data.subject,
          content: data.content,
          sendEmail: data.sendEmail,
          sendNotification: data.sendNotification,
        });
      }

      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Message sent to ${response.data.sent} recipients`,
        });
        setIsSendDialogOpen(false);
        loadData();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Attendee Communication</h1>
            <p className="text-muted-foreground mt-1">
              Send messages to segments, tags, or event registrations
            </p>
          </div>
          <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Message</DialogTitle>
              </DialogHeader>
              <SendMessageForm
                recipientType={recipientType as "segment" | "tag" | "event"}
                segments={segments}
                tags={tags}
                onSubmit={handleSendMessage}
                onCancel={() => setIsSendDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Communication History</h2>
          {loading ? (
            <div className="text-center py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages sent yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{message.subject}</h3>
                          <Badge variant="outline">{message.recipientType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {message.content}
                        </p>
                        {message.event && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Event: {message.event.title}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {message.sentCount} sent
                          </span>
                          {message.failedCount > 0 && (
                            <span className="flex items-center gap-1 text-destructive">
                              <XCircle className="h-3 w-3" />
                              {message.failedCount} failed
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </OrganizerLayout>
  );
};

const SendMessageForm = ({
  recipientType: initialRecipientType,
  segments,
  tags,
  onSubmit,
  onCancel,
}: {
  recipientType: "segment" | "tag" | "event";
  segments: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  onSubmit: (data: {
    recipientType: "segment" | "tag" | "event";
    recipientId: string;
    subject: string;
    content: string;
    sendEmail?: boolean;
    sendNotification?: boolean;
  }) => void;
  onCancel: () => void;
}) => {
  const [recipientType, setRecipientType] = useState<"segment" | "tag" | "event">(initialRecipientType);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      recipientType,
      recipientId,
      subject,
      content,
      sendEmail,
      sendNotification,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="recipientType">Recipient Type *</Label>
        <Select
          value={recipientType}
          onValueChange={(value: "segment" | "tag" | "event") => setRecipientType(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="segment">Segment</SelectItem>
            <SelectItem value="tag">Tag</SelectItem>
            <SelectItem value="event">Event Registrations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="recipientId">
          {recipientType === "segment"
            ? "Segment *"
            : recipientType === "tag"
            ? "Tag *"
            : "Event ID *"}
        </Label>
        {recipientType === "segment" ? (
          <Select value={recipientId} onValueChange={setRecipientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a segment" />
            </SelectTrigger>
            <SelectContent>
              {segments.map((segment) => (
                <SelectItem key={segment.id} value={segment.id}>
                  {segment.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : recipientType === "tag" ? (
          <Select value={recipientId} onValueChange={setRecipientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tag" />
            </SelectTrigger>
            <SelectContent>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="recipientId"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            required
            placeholder="Enter event ID"
          />
        )}
      </div>

      <div>
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="content">Message *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendEmail"
            checked={sendEmail}
            onCheckedChange={(checked) => setSendEmail(!!checked)}
          />
          <Label htmlFor="sendEmail">Send Email</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendNotification"
            checked={sendNotification}
            onCheckedChange={(checked) => setSendNotification(!!checked)}
          />
          <Label htmlFor="sendNotification">Send In-App Notification</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Send Message</Button>
      </div>
    </form>
  );
};

export default AttendeeCommunication;

