/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Mail, MailOpen, Trash2, Reply, Calendar, ChevronLeft } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import { getInbox, getSentMessages, sendMessage, getMessageThread, markMessageAsRead, deleteMessage } from "@/lib/user-dashboard-api";
import EmptyState from "@/components/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DirectMessaging: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inbox, setInbox] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [messageData, setMessageData] = useState({
    recipientId: "",
    recipientEmail: "",
    subject: "",
    content: "",
    eventId: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const [inboxResponse, sentResponse] = await Promise.all([
        getInbox({ page: 1, limit: 50 }),
        getSentMessages({ page: 1, limit: 50 }),
      ]);

      if (inboxResponse.success && inboxResponse.data) {
        setInbox(inboxResponse.data.messages || []);
        setUnreadCount(inboxResponse.data.unreadCount || 0);
      }

      if (sentResponse.success && sentResponse.data) {
        setSent(sentResponse.data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageData.recipientId && !messageData.recipientEmail) {
      showErrorToast(toast, null, "Please provide a recipient");
      return;
    }

    if (!messageData.content.trim()) {
      showErrorToast(toast, null, "Message content is required");
      return;
    }

    try {
      setSending(true);
      const response = await sendMessage({
        recipientId: messageData.recipientId || "",
        subject: messageData.subject || undefined,
        content: messageData.content,
        eventId: messageData.eventId || undefined,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Message sent successfully",
        });
        setMessageData({
          recipientId: "",
          recipientEmail: "",
          subject: "",
          content: "",
          eventId: "",
        });
        setShowComposeDialog(false);
        fetchMessages();
      }
    } catch (error: any) {
      showErrorToast(toast, error, "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleViewMessage = async (messageId: string) => {
    try {
      const response = await getMessageThread(messageId);
      if (response.success && response.data) {
        setSelectedMessage(response.data.message);
        if (!response.data.message.isRead) {
          await markMessageAsRead(messageId);
          fetchMessages();
        }
      }
    } catch (error) {
      console.error("Error viewing message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await deleteMessage(messageId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Message deleted",
        });
        fetchMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (error: any) {
      showErrorToast(toast, error, "Failed to delete message");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="xl" className="text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Messages</h1>
            <p className="text-muted-foreground text-sm">
              Send and receive messages with organizers and other attendees
            </p>
          </div>
        </div>
        <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
              <DialogDescription>
                Send a message to another user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient">Recipient Email or User ID</Label>
                <Input
                  id="recipient"
                  value={messageData.recipientEmail || messageData.recipientId}
                  onChange={(e) => {
                    if (e.target.value.includes("@")) {
                      setMessageData({ ...messageData, recipientEmail: e.target.value, recipientId: "" });
                    } else {
                      setMessageData({ ...messageData, recipientId: e.target.value, recipientEmail: "" });
                    }
                  }}
                  placeholder="user@example.com or user-id"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Input
                  id="subject"
                  value={messageData.subject}
                  onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                  placeholder="Message subject"
                />
              </div>
              <div>
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={messageData.content}
                  onChange={(e) => setMessageData({ ...messageData, content: e.target.value })}
                  placeholder="Type your message..."
                  rows={6}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendMessage}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inbox">
            Inbox {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          {inbox.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No Messages"
              description="You don't have any messages yet"
            />
          ) : (
            inbox.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  !message.isRead ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => handleViewMessage(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={message.sender?.firstName || message.sender?.email || "User"}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {message.sender?.firstName} {message.sender?.lastName || ""}
                          </p>
                          {!message.isRead && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {message.subject && (
                        <p className="font-medium text-foreground mb-1">{message.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                      {message.event && (
                        <Badge variant="outline" className="mt-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          {message.event.title}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sent.length === 0 ? (
            <EmptyState
              icon={MailOpen}
              title="No Sent Messages"
              description="You haven't sent any messages yet"
            />
          ) : (
            sent.map((message) => (
              <Card
                key={message.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewMessage(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={message.recipient?.firstName || message.recipient?.email || "User"}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-foreground">
                          To: {message.recipient?.firstName} {message.recipient?.lastName || message.recipient?.email}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {message.subject && (
                        <p className="font-medium text-foreground mb-1">{message.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={Boolean(selectedMessage)} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMessage.subject || "Message"}</DialogTitle>
              <DialogDescription>
                {selectedMessage.sender?.firstName} {selectedMessage.sender?.lastName || selectedMessage.sender?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
              </div>
              {selectedMessage.event && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Related Event:</p>
                  <p className="text-sm">{selectedMessage.event.title}</p>
                </div>
              )}
              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Replies</h4>
                  <div className="space-y-2">
                    {selectedMessage.replies.map((reply: any) => (
                      <div key={reply.id} className="p-3 bg-card border border-border rounded-lg">
                            <p className="text-sm font-medium mb-1">
                              {reply.sender?.firstName} {reply.sender?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      // TODO: Implement reply functionality
                      setSelectedMessage(null);
                    }}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      );
    };

    export default DirectMessaging;
