import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Plus,
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
import { extractErrorMessage } from "@/lib/utils/error";

interface EventCommunicationSectionProps {
  eventId: string;
  eventTitle: string;
}

const EventCommunicationSection = ({ eventId, eventTitle }: EventCommunicationSectionProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        const response = await getCommunicationHistory({ eventId });
        if (response.success && response.data) {
          setMessages(response.data.messages || []);
        }
      } catch (error) {
        console.error("Error loading communication history:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [eventId]);

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

  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default EventCommunicationSection;
