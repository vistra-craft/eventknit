import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Plus,
  Inbox,
  Reply,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ButtonLoader } from "./ui/loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { useToast } from "@/hooks/useToast";
import { sendToEventRegistrations, getCommunicationHistory, type CommunicationMessage } from "@/lib/organizer-dashboard-api";
import { getInbox, sendMessage, type DirectMessage } from "@/lib/user-dashboard-api";
import { extractErrorMessage } from "@/lib/utils/error";

interface EventCommunicationSectionProps {
  eventId: string;
  eventTitle: string;
}

const EventCommunicationSection = ({ eventId, eventTitle }: EventCommunicationSectionProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"broadcasts" | "inbox">("broadcasts");

  // Broadcasts
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [sending, setSending] = useState(false);

  // Inbox (DMs from attendees)
  const [inboxMessages, setInboxMessages] = useState<DirectMessage[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxLoaded, setInboxLoaded] = useState(false);
  const [replyTarget, setReplyTarget] = useState<DirectMessage | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);

  const loadBroadcasts = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const response = await getCommunicationHistory({ eventId });
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
      }
    } catch {
      // non-critical — history is informational only
    } finally {
      setLoading(false);
    }
  };

  const loadInbox = async () => {
    try {
      setInboxLoading(true);
      const response = await getInbox({ limit: 100 });
      if (response.success && response.data) {
        // Filter client-side to this event's messages
        const eventMessages = response.data.messages.filter(
          (m) => m.eventId === eventId
        );
        setInboxMessages(eventMessages);
        setInboxLoaded(true);
      }
    } catch {
      // non-critical
    } finally {
      setInboxLoading(false);
    }
  };

  useEffect(() => {
    void loadBroadcasts();
  }, [eventId]);

  useEffect(() => {
    if (activeTab === "inbox" && !inboxLoaded) {
      void loadInbox();
    }
  }, [activeTab]);

  const handleSendMessage = async () => {
    if (!eventId || !subject.trim() || !content.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in subject and content",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const response = await sendToEventRegistrations(eventId, {
        subject: subject.trim(),
        content: content.trim(),
        sendEmail,
        sendNotification,
      });

      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Message sent to ${response.data.sent} recipients`,
        });
        setIsSendDialogOpen(false);
        setSubject("");
        setContent("");
        // Reload messages
        const historyResponse = await getCommunicationHistory({ eventId });
        if (historyResponse.success && historyResponse.data) {
          setMessages(historyResponse.data.messages || []);
        }
      }
    } catch (err) {
      toast({
        title: "Send failed",
        description: extractErrorMessage(err, "Failed to send message"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!replyTarget || !replyContent.trim()) return;
    try {
      setReplying(true);
      await sendMessage({
        recipientId: replyTarget.senderId,
        subject: `Re: ${replyTarget.subject || "Your message"}`,
        content: replyContent.trim(),
        eventId,
        parentMessageId: replyTarget.id,
      });
      toast({ title: "Reply sent" });
      setReplyTarget(null);
      setReplyContent("");
      // Refresh inbox
      setInboxLoaded(false);
      void loadInbox();
    } catch (err) {
      toast({
        title: "Reply failed",
        description: extractErrorMessage(err, "Could not send reply"),
        variant: "destructive",
      });
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "broadcasts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("broadcasts")}
        >
          <Mail className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Broadcasts
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "inbox" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("inbox")}
        >
          <Inbox className="h-4 w-4 inline mr-1.5 -mt-0.5" />
          Attendee Messages
          {inboxMessages.filter(m => !m.isRead).length > 0 && (
            <Badge className="ml-1.5 bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
              {inboxMessages.filter(m => !m.isRead).length}
            </Badge>
          )}
        </button>
      </div>

      {activeTab === "broadcasts" && (
      <>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Communication</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Send messages to all attendees of {eventTitle}
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
              <DialogTitle>Send Message to Attendees</DialogTitle>
              <DialogDescription>
                Send a message to all registered attendees for this event
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter message subject"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="content">Message Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your message..."
                  className="mt-2 min-h-[200px]"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send-email"
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                  />
                  <Label htmlFor="send-email">Send via Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="send-notification"
                    checked={sendNotification}
                    onCheckedChange={setSendNotification}
                  />
                  <Label htmlFor="send-notification">Send via In-App Notification</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSendDialogOpen(false);
                  setSubject("");
                  setContent("");
                }}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={sending}>
                {sending ? (
                  <>
                    <ButtonLoader />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </DialogFooter>
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
                        <Badge variant="outline">Event Registrations</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {message.sentCount || 0} sent
                        </span>
                        {message.failedCount != null && message.failedCount > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3 w-3" />
                            {message.failedCount} failed
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'N/A'}
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
      </>
      )}

      {/* ── Inbox tab ─────────────────────────────────────────────────────── */}
      {activeTab === "inbox" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Attendee Messages</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Direct messages sent to you by attendees of {eventTitle}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setInboxLoaded(false); void loadInbox(); }}>
              Refresh
            </Button>
          </div>

          {inboxLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading messages…</div>
          ) : inboxMessages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages from attendees yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Messages sent by attendees about this event will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {inboxMessages.map((dm) => (
                <Card key={dm.id} className={!dm.isRead ? "border-primary/40 bg-primary/[0.02]" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!dm.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                          <span className="font-semibold text-sm truncate">
                            {dm.sender
                              ? `${dm.sender.firstName} ${dm.sender.lastName}`
                              : "Attendee"}
                          </span>
                          {dm.subject && (
                            <span className="text-muted-foreground text-sm">· {dm.subject}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">{dm.content}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {new Date(dm.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => { setReplyTarget(dm); setReplyContent(""); }}
                      >
                        <Reply className="h-3.5 w-3.5 mr-1.5" />
                        Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply dialog */}
      <Dialog open={!!replyTarget} onOpenChange={(open) => { if (!open) setReplyTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {replyTarget?.sender ? `${replyTarget.sender.firstName} ${replyTarget.sender.lastName}` : "Attendee"}</DialogTitle>
            <DialogDescription>
              {replyTarget?.subject ? `Re: ${replyTarget.subject}` : "Direct reply to their message"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reply-content">Message</Label>
            <Textarea
              id="reply-content"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply…"
              className="mt-2 min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyTarget(null)} disabled={replying}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={replying || !replyContent.trim()}>
              {replying ? <><ButtonLoader />Sending…</> : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCommunicationSection;
