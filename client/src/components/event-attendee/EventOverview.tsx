/**
 * EventOverview — merged replacement for EventHome + EventMyEvent.
 * Left sidebar: profile, registration status, quick actions.
 * Right main: hero, countdown, registration details, announcements,
 *             sponsors, event details, venue map.
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  ExternalLink,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Globe2,
  Timer,
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
import { RichTextContent } from "@/components/ui/RichTextContent";
import { EventMap } from "@/components/EventMap";
import { downloadTicketPDF } from "@/lib/ticket-api";
import { getNotifications, markAllAsRead, type Notification } from "@/lib/notification-api";
import { sendMessage } from "@/lib/user-dashboard-api";
import { useToast } from "@/hooks/useToast";
import { showErrorToast } from "@/lib/utils/error";
import type { EventData, User, Sponsor } from "./EventAttendeeView";

// ─── Sponsor helpers ──────────────────────────────────────────────────────────

const sponsorTierOrder: Sponsor["level"][] = [
  "title", "presenting", "platinum", "gold", "silver", "bronze", "associate", "community",
];

const sponsorTierLabels: Record<Sponsor["level"], string> = {
  title: "Title Sponsor",
  presenting: "Presenting Sponsor",
  platinum: "Platinum Sponsor",
  gold: "Gold Sponsor",
  silver: "Silver Sponsor",
  bronze: "Bronze Sponsor",
  associate: "Associate Sponsor",
  community: "Community Partner",
};

const socialPlatformConfig: Record<string, { icon: React.ElementType; label: string }> = {
  twitter: { icon: Twitter, label: "Twitter" },
  x: { icon: Twitter, label: "X (Twitter)" },
  facebook: { icon: Facebook, label: "Facebook" },
  instagram: { icon: Instagram, label: "Instagram" },
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  youtube: { icon: Youtube, label: "YouTube" },
  github: { icon: Github, label: "GitHub" },
  website: { icon: Globe2, label: "Website" },
};

// ─── Countdown ────────────────────────────────────────────────────────────────

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isStarted: boolean;
  isOver: boolean;
}

function useCountdown(eventDate: string, endDate?: string): CountdownParts {
  const compute = (): CountdownParts => {
    const now = Date.now();
    const start = new Date(eventDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : start + 24 * 60 * 60 * 1000;
    if (now >= end) return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true, isOver: true };
    if (now >= start) return { days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true, isOver: false };
    const diff = start - now;
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      isStarted: false,
      isOver: false,
    };
  };

  const [countdown, setCountdown] = useState<CountdownParts>(compute);
  useEffect(() => {
    if (countdown.isOver) return;
    const id = setInterval(() => setCountdown(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventDate, endDate, countdown.isOver]);
  return countdown;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex flex-col items-center min-w-[36px]">
      <span className="bg-foreground/5 border border-border rounded-md px-2 py-0.5 font-mono text-sm font-bold text-foreground tabular-nums">
        {pad(value)}
      </span>
      <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function CountdownStrip({ event }: { event: EventData }) {
  const cd = useCountdown(event.date, event.endDate);
  if (cd.isOver) return null;

  if (cd.isStarted) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-success/10 border border-success/20 w-fit">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
        </span>
        <span className="text-success font-semibold text-sm">Happening Now</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Timer className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Starts in</span>
      </div>
      <div className="flex items-center gap-1">
        {cd.days > 0 && (
          <>
            <CountdownUnit value={cd.days} label="d" />
            <span className="text-muted-foreground font-bold text-sm mb-1">:</span>
          </>
        )}
        <CountdownUnit value={cd.hours} label="h" />
        <span className="text-muted-foreground font-bold text-sm mb-1">:</span>
        <CountdownUnit value={cd.minutes} label="m" />
        <span className="text-muted-foreground font-bold text-sm mb-1">:</span>
        <CountdownUnit value={cd.seconds} label="s" />
      </div>
    </div>
  );
}

// ─── Announcement helpers ─────────────────────────────────────────────────────

function AnnouncementIcon({ type }: { type: string }) {
  if (type.includes("CANCELLED") || type.includes("FAILED"))
    return <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />;
  if (type.includes("UPDATE") || type.includes("CHANGED") || type.includes("POSTPONED"))
    return <Megaphone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />;
  return <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getEventStatus(event: EventData): { label: string; color: string } {
  if (event.status === "ongoing") return { label: "Live Now", color: "bg-success/10 text-success" };
  if (event.status === "completed") return { label: "Completed", color: "bg-muted text-muted-foreground" };
  const now = new Date();
  const start = new Date(event.date);
  const end = event.endDate ? new Date(event.endDate) : start;
  if (now < start) return { label: "Upcoming", color: "bg-primary/10 text-primary" };
  if (now >= start && now <= end) return { label: "Live Now", color: "bg-success/10 text-success" };
  return { label: "Completed", color: "bg-muted text-muted-foreground" };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EventOverviewProps {
  event: EventData;
  user: User;
}

export const EventOverview: React.FC<EventOverviewProps> = ({ event, user }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const status = getEventStatus(event);

  // Announcements
  const [announcements, setAnnouncements] = useState<Notification[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  // Actions state
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactContent, setContactContent] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      const res = await getNotifications({ eventId: event.id, limit: 20 });
      if (res.success && res.data) setAnnouncements(res.data.notifications);
    } catch {
      // non-critical
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [event.id]);

  useEffect(() => { void loadAnnouncements(); }, [loadAnnouncements]);

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await markAllAsRead();
      setAnnouncements(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silently ignore */ } finally { setMarkingRead(false); }
  };

  const handleAddToCalendar = () => {
    const start = new Date(event.date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end = event.endDate
      ? new Date(event.endDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      : start;
    const loc = event.venue ?? event.location;
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&location=${encodeURIComponent(loc)}&details=${encodeURIComponent(event.description ?? "")}`,
      "_blank", "noopener,noreferrer"
    );
  };

  const handleShare = () => {
    if (navigator.share) void navigator.share({ title: event.title, url: window.location.href });
    else void navigator.clipboard.writeText(window.location.href);
  };

  const handleDownloadTicket = async () => {
    if (!event.registrationId || downloadingTicket) return;
    setDownloadingTicket(true);
    try { await downloadTicketPDF(event.registrationId); }
    catch { /* handled internally */ } finally { setDownloadingTicket(false); }
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
    } catch (err) { showErrorToast(toast, err, "Failed to send message"); }
    finally { setSendingContact(false); }
  };

  const unreadCount = announcements.filter(n => !n.isRead).length;

  const sponsorsByTier = React.useMemo(() => {
    if (!event.sponsors?.length) return {};
    const grouped: Record<string, Sponsor[]> = {};
    event.sponsors.forEach(s => {
      const tier = s.level || "associate";
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(s);
    });
    return grouped;
  }, [event.sponsors]);

  const formatDateRange = (): string => {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    const start = new Date(event.date).toLocaleDateString("en-US", opts);
    if (event.endDate) {
      return `${start} – ${new Date(event.endDate).toLocaleDateString("en-US", opts)}`;
    }
    return start;
  };

  const formatDateLong = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="relative">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <div className="relative rounded-xl overflow-hidden">
          <div
            className="h-[240px] sm:h-[280px] bg-cover bg-center"
            style={{
              backgroundImage: event.image
                ? `url(${event.image})`
                : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.title}</h1>
            {event.hashtag && (
              <Badge className="bg-primary/90 text-white border-0 text-sm mb-2">#{event.hashtag}</Badge>
            )}
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDateRange()}</span>
              {event.time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{event.time}</span>}
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.venue ?? event.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Profile + registration status */}
            <Card variant="github" className="sticky top-24 overflow-hidden">
              <div className="absolute top-3 right-3">
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => navigate("/user/profile")}
                >
                  Edit
                </Button>
              </div>
              <CardContent className="pt-8 pb-5 px-5 text-center">
                <Avatar src={user.profileImage} name={user.name} alt={user.name} size="lg" className="mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground">{user.name}</h3>
                {user.title && <p className="text-xs text-muted-foreground mt-0.5">{user.title}</p>}
                {user.company && <p className="text-xs text-muted-foreground">{user.company}</p>}
                {user.email && <p className="text-xs text-muted-foreground mt-1">{user.email}</p>}

                {event.registrationId && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Registered</span>
                    </div>
                    <Badge className={`mt-2 block text-center ${status.color}`}>{status.label}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {event.registrationId && (
              <Card variant="github">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-1.5">
                  <Button variant="outline" className="w-full justify-start text-sm h-8" onClick={handleAddToCalendar}>
                    <CalendarPlus className="w-3.5 h-3.5 mr-2" />Add to Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm h-8" onClick={handleShare}>
                    <Share2 className="w-3.5 h-3.5 mr-2" />Share Event
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-8"
                    onClick={handleDownloadTicket}
                    disabled={downloadingTicket}
                  >
                    <Download className="w-3.5 h-3.5 mr-2" />
                    {downloadingTicket ? "Downloading…" : "Download Ticket"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-8"
                    onClick={() => { window.location.href = "/user/notifications"; }}
                  >
                    <Bell className="w-3.5 h-3.5 mr-2" />All Notifications
                  </Button>
                  {event.organizerId && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm h-8"
                      onClick={() => setIsContactOpen(true)}
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-2" />Contact Organizer
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Main content ──────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Countdown / live strip */}
            <CountdownStrip event={event} />

            {/* Registration confirmed banner (compact) */}
            {event.registrationId && (
              <Card variant="github" className="overflow-hidden">
                <div className="bg-success/5 border-b border-success/20 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4.5 h-4.5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">You're Registered</p>
                      <p className="text-xs text-muted-foreground">Your spot is confirmed</p>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </div>
                <CardContent className="px-5 py-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center px-3 py-2.5 bg-muted/40 rounded-lg">
                      <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className="text-center px-3 py-2.5 bg-muted/40 rounded-lg">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Time</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{event.time || "TBA"}</p>
                    </div>
                    <div className="text-center px-3 py-2.5 bg-muted/40 rounded-lg">
                      <MapPin className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Location</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5 line-clamp-1">
                        {event.venue ?? event.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Registration details */}
            {event.registrationId && (
              <Card variant="github">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Ticket className="w-4 h-4 text-primary" />
                    Registration Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.ticketType && (
                      <div className="flex items-start gap-3 px-3 py-2.5 bg-muted/40 rounded-lg">
                        <Ticket className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ticket Type</p>
                          <p className="text-sm font-medium text-foreground">{event.ticketType}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 px-3 py-2.5 bg-muted/40 rounded-lg">
                      <Hash className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Registration ID</p>
                        <p className="font-mono text-xs font-medium text-foreground break-all">{event.registrationId}</p>
                      </div>
                    </div>
                    {event.backupCode && (
                      <div className="flex items-start gap-3 px-3 py-2.5 bg-muted/40 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Backup Code</p>
                          <p className="font-mono text-sm font-semibold text-foreground tracking-widest">
                            {event.backupCode}
                          </p>
                        </div>
                      </div>
                    )}
                    {event.registrationDate && (
                      <div className="flex items-start gap-3 px-3 py-2.5 bg-muted/40 rounded-lg">
                        <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Registered On</p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(event.registrationDate).toLocaleDateString("en-US", {
                              month: "long", day: "numeric", year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seat allocation */}
                  {event.seat && (
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Armchair className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Seat Allocation</span>
                        <Badge className="bg-primary/10 text-primary text-xs uppercase">
                          {event.seat.seatType}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Seat</p>
                          <p className="text-base font-bold text-primary">{event.seat.seatIdentifier}</p>
                        </div>
                        {event.seat.sectionId && (
                          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Section</p>
                            <p className="text-sm font-semibold text-foreground">{event.seat.sectionId}</p>
                          </div>
                        )}
                        {event.seat.rowLabel && (
                          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Row</p>
                            <p className="text-sm font-semibold text-foreground">{event.seat.rowLabel}</p>
                          </div>
                        )}
                        {event.seat.seatLabel && (
                          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-muted-foreground mb-0.5">Seat #</p>
                            <p className="text-sm font-semibold text-foreground">{event.seat.seatLabel}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        Seat reserved &amp; confirmed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Announcements */}
            <Card variant="github">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Megaphone className="w-4 h-4 text-primary" />
                    Announcements
                    {unreadCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
                        {unreadCount}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-1">
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
                  <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                    Loading announcements…
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                    <MessageCircle className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No announcements yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {announcements.map(a => (
                      <li
                        key={a.id}
                        className={`flex gap-3 py-3.5 ${a.isRead ? "" : "bg-primary/[0.03] -mx-6 px-6"}`}
                      >
                        <AnnouncementIcon type={a.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm leading-snug ${a.isRead ? "text-foreground" : "font-semibold"}`}>
                              {a.title}
                            </p>
                            {!a.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{relativeTime(a.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Sponsors */}
            {event.sponsors && event.sponsors.length > 0 && (
              <Card variant="github">
                <CardContent className="p-5 space-y-5">
                  {sponsorTierOrder.map(tier => {
                    const sponsors = sponsorsByTier[tier];
                    if (!sponsors?.length) return null;
                    return (
                      <div key={tier}>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                          {sponsorTierLabels[tier]}
                        </h3>
                        <div className="flex flex-wrap items-center gap-5">
                          {sponsors.map((s, idx) => (
                            <a
                              key={s.id ?? idx}
                              href={s.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:opacity-75 transition-opacity"
                            >
                              {s.logo ? (
                                <img src={s.logo} alt={s.name} className="h-9 w-auto object-contain" />
                              ) : (
                                <div className="h-9 px-3 bg-muted rounded flex items-center">
                                  <span className="text-sm font-medium text-muted-foreground">{s.name}</span>
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Event Details */}
            <Card variant="github">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-0.5 text-muted-foreground/60 flex-shrink-0" />
                    <div>
                      <p>From {formatDateLong(event.date)}{event.time && ` · ${event.time}`}</p>
                      {event.endDate && <p>To {formatDateLong(event.endDate)}</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 mt-0.5 text-muted-foreground/60 flex-shrink-0" />
                    <p>Dates shown in your local time zone</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground/60 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{event.venue ?? event.location}</p>
                      {event.venue && event.location && event.venue !== event.location && (
                        <p>{event.location}</p>
                      )}
                    </div>
                  </div>
                </div>

                {(event.fullDescription ?? event.description) && (
                  <RichTextContent
                    content={event.fullDescription ?? event.description ?? ""}
                    className="text-sm text-muted-foreground"
                  />
                )}

                {event.socialLinks && Object.keys(event.socialLinks).length > 0 && (
                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    {Object.entries(event.socialLinks).map(([platform, url]) => {
                      if (!url) return null;
                      const cfg = socialPlatformConfig[platform.toLowerCase()] ?? {
                        icon: ExternalLink,
                        label: platform.charAt(0).toUpperCase() + platform.slice(1),
                      };
                      const Icon = cfg.icon;
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title={cfg.label}
                        >
                          <Icon className="w-4 h-4" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Venue Map */}
            {!event.isOnline && (event.venue || event.location) && (
              <Card variant="github">
                <CardContent className="p-0 overflow-hidden">
                  <div className="relative h-[200px]">
                    <EventMap
                      venue={event.venue || ""}
                      location={event.location}
                      coordinates={event.coordinates}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-3 right-3 shadow-lg z-10"
                      onClick={() => {
                        const q = encodeURIComponent(`${event.venue ? event.venue + ", " : ""}${event.location}`);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
              <Label htmlFor="overview-contact-subject">Subject</Label>
              <Input
                id="overview-contact-subject"
                value={contactSubject}
                onChange={e => setContactSubject(e.target.value)}
                placeholder={`Question about ${event.title}`}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="overview-contact-content">Message *</Label>
              <Textarea
                id="overview-contact-content"
                value={contactContent}
                onChange={e => setContactContent(e.target.value)}
                placeholder="Write your message to the organizer…"
                className="mt-2 min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactOpen(false)} disabled={sendingContact}>
              Cancel
            </Button>
            <Button
              onClick={handleContactOrganizer}
              disabled={sendingContact || !contactContent.trim()}
            >
              {sendingContact ? "Sending…" : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventOverview;
