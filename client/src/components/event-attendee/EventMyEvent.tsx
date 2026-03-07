import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  CalendarPlus,
  Bell,
  Download,
  CheckCircle,
  Ticket,
  Armchair,
  Megaphone,
  AlertTriangle,
  Info,
  RefreshCw,
  Hash,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { downloadTicketPDF } from "@/lib/ticket-api";
import { getNotifications, markAllAsRead, type Notification } from "@/lib/notification-api";
import { sendMessage } from "@/lib/user-dashboard-api";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { RichTextContent } from "@/components/ui/RichTextContent";
import type { EventData, User } from "./EventAttendeeView";

interface EventMyEventProps {
  event: EventData;
  user: User;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getEventStatus(event: EventData): { label: string; color: string } {
  if (event.status === 'ongoing') return { label: 'Live Now', color: 'bg-success/10 text-success' };
  if (event.status === 'completed') return { label: 'Completed', color: 'bg-muted text-muted-foreground' };
  const eventDate = new Date(event.date);
  const now = new Date();
  const endDate = event.endDate ? new Date(event.endDate) : eventDate;
  if (now < eventDate) return { label: 'Upcoming', color: 'bg-primary/10 text-primary' };
  if (now >= eventDate && now <= endDate) return { label: 'Live Now', color: 'bg-success/10 text-success' };
  return { label: 'Completed', color: 'bg-muted text-muted-foreground' };
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AnnouncementIcon({ type }: { type: string }) {
  if (type.includes('CANCELLED') || type.includes('FAILED'))
    return <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />;
  if (type.includes('UPDATE') || type.includes('CHANGED') || type.includes('POSTPONED'))
    return <Megaphone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />;
  return <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EventMyEvent: React.FC<EventMyEventProps> = ({ event, user }) => {
  const status = getEventStatus(event);
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<Notification[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [downloadingTicket, setDownloadingTicket] = useState(false);

  // Contact Organizer
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactContent, setContactContent] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      // Fetch notifications for this specific event — these include organizer broadcasts
      const res = await getNotifications({ eventId: event.id, limit: 20 });
      if (res.success && res.data) {
        setAnnouncements(res.data.notifications);
      }
    } catch {
      // non-critical
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await markAllAsRead();
      setAnnouncements(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // silently ignore
    } finally {
      setMarkingRead(false);
    }
  };

  const handleAddToCalendar = () => {
    const start = new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = event.endDate
      ? new Date(event.endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      : start;
    const location = event.venue ?? event.location;
    const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(event.description ?? '')}`;
    window.open(gcal, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({
        title: event.title,
        text: `Check out ${event.title}`,
        url: window.location.href,
      });
    } else {
      void navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownloadTicket = async () => {
    if (!event.registrationId || downloadingTicket) return;
    setDownloadingTicket(true);
    try {
      await downloadTicketPDF(event.registrationId);
    } catch {
      // user-visible feedback handled by downloadTicketPDF
    } finally {
      setDownloadingTicket(false);
    }
  };

  const handleContactOrganizer = async () => {
    if (!event.organizerId || !contactContent.trim()) return;
    setSendingContact(true);
    try {
      await sendMessage({
        recipientId: event.organizerId,
        subject: contactSubject.trim() || `Question about ${event.title}`,
        content: contactContent.trim(),
        eventId: event.id,
      });
      toast({ title: "Message sent", description: "The organizer will reply shortly." });
      setIsContactOpen(false);
      setContactSubject("");
      setContactContent("");
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setSendingContact(false);
    }
  };

  const unreadCount = announcements.filter(n => !n.isRead).length;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Registration confirmed banner */}
          <Card variant="github" className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">You're Registered!</h2>
                  <p className="text-white/80 text-sm mt-1">
                    Your spot is confirmed for this event
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Event Date</p>
                  <p className="font-medium text-foreground mt-1">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <MapPin className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground mt-1 line-clamp-1">
                    {event.venue ?? event.location}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 text-center p-4 bg-muted/50 rounded-xl">
                  <Badge className={`mx-auto text-sm ${status.color}`}>
                    {status.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">Event Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Details */}
          <Card variant="github">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Registration Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.ticketType && (
                  <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                    <Ticket className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ticket Type</p>
                      <p className="font-medium text-foreground">{event.ticketType}</p>
                    </div>
                  </div>
                )}

                {event.registrationId && (
                  <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                    <Hash className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Registration ID</p>
                      <p className="font-mono text-sm font-medium text-foreground break-all">
                        {event.registrationId}
                      </p>
                    </div>
                  </div>
                )}

                {event.backupCode && (
                  <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Backup Code</p>
                      <p className="font-mono text-sm font-semibold text-foreground tracking-widest">
                        {event.backupCode}
                      </p>
                    </div>
                  </div>
                )}

                {event.registrationDate && (
                  <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Registered On</p>
                      <p className="font-medium text-foreground">
                        {new Date(event.registrationDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Seat Allocation */}
              {event.seat && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Armchair className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Seat Allocation</h4>
                    <Badge className="bg-primary/10 text-primary text-xs">
                      {event.seat.seatType}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Seat</p>
                      <p className="text-lg font-bold text-primary">
                        {event.seat.seatIdentifier}
                      </p>
                    </div>
                    {event.seat.sectionId && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Section</p>
                        <p className="font-semibold text-foreground">{event.seat.sectionId}</p>
                      </div>
                    )}
                    {event.seat.rowLabel && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Row</p>
                        <p className="font-semibold text-foreground">{event.seat.rowLabel}</p>
                      </div>
                    )}
                    {event.seat.seatLabel && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Seat #</p>
                        <p className="font-semibold text-foreground">{event.seat.seatLabel}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                    Seat reserved &amp; confirmed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card variant="github">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{formatDate(event.date)}</p>
                  {event.endDate && event.endDate !== event.date && (
                    <p className="text-sm text-muted-foreground">to {formatDate(event.endDate)}</p>
                  )}
                </div>
              </div>

              {event.time && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <p className="font-medium text-foreground">{event.time}</p>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{event.venue ?? event.location}</p>
                  {event.venue && event.location && event.venue !== event.location && (
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  )}
                </div>
              </div>

              {(event.fullDescription ?? event.description) && (
                <div className="pt-4 border-t border-border">
                  <RichTextContent
                    content={event.fullDescription ?? event.description ?? ''}
                    className="text-muted-foreground"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizer Announcements */}
          <Card variant="github">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  Event Announcements
                  {unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
                      {unreadCount} new
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary h-7"
                      onClick={handleMarkAllRead}
                      disabled={markingRead}
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => void loadAnnouncements()}
                    title="Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {announcementsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  Loading announcements…
                </div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">No announcements yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The organizer hasn't posted any updates for this event
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {announcements.map(announcement => (
                    <li
                      key={announcement.id}
                      className={`flex gap-3 py-4 ${announcement.isRead ? '' : 'bg-primary/[0.03] -mx-6 px-6 first:-mt-2 first:pt-4'}`}
                    >
                      <AnnouncementIcon type={announcement.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm leading-snug ${announcement.isRead ? 'text-foreground' : 'font-semibold text-foreground'}`}>
                            {announcement.title}
                          </p>
                          {!announcement.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {announcement.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {relativeTime(announcement.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card variant="github">
            <CardContent className="pt-6 text-center">
              <Avatar
                src={user.profileImage}
                name={user.name}
                alt={user.name}
                size="lg"
                className="mx-auto mb-4"
              />
              <h3 className="font-semibold text-foreground">{user.name}</h3>
              {user.title && (
                <p className="text-sm text-muted-foreground">{user.title}</p>
              )}
              {user.company && (
                <p className="text-sm text-muted-foreground">{user.company}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">{user.email}</p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card variant="github">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAddToCalendar}
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Event
              </Button>

              {event.registrationId && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleDownloadTicket}
                  disabled={downloadingTicket}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadingTicket ? 'Downloading…' : 'Download Ticket'}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/user/dashboard?section=notifications'}
              >
                <Bell className="w-4 h-4 mr-2" />
                All Notifications
              </Button>

              {event.organizerId && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsContactOpen(true)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Organizer
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Organizer dialog */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Organizer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="contact-subject">Subject</Label>
              <Input
                id="contact-subject"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder={`Question about ${event.title}`}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="contact-content">Message *</Label>
              <Textarea
                id="contact-content"
                value={contactContent}
                onChange={(e) => setContactContent(e.target.value)}
                placeholder="Write your message to the organizer…"
                className="mt-2 min-h-[140px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactOpen(false)} disabled={sendingContact}>
              Cancel
            </Button>
            <Button onClick={handleContactOrganizer} disabled={sendingContact || !contactContent.trim()}>
              {sendingContact ? "Sending…" : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventMyEvent;
