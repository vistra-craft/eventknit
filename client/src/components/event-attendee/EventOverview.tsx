/**
 * EventOverview — Redesigned attendee event overview page.
 *
 * Layout: Single-column, content-focused design inspired by Lu.ma and Eventbrite.
 * - Inline event image (not a full-width hero) alongside key details
 * - Attendee count with social proof (avatar-style tally)
 * - Sticky action bar for quick access to ticket, calendar, share, contact
 * - Comprehensive sections: about, organizer, speakers, agenda preview,
 *   exhibitors, sponsors, FAQs, requirements, venue/map, announcements
 */
import React, { useState, useEffect, useCallback } from "react";
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
  ChevronDown,
  ChevronRight,
  Tag,
  ShieldCheck,
  AlertCircle,
  Mic2,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { stripHtml } from "@/lib/utils";
import type { EventData, Sponsor } from "./EventAttendeeView";
import { EventSurveyPrompt } from "./EventSurveyPrompt";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const sponsorTierOrder: Sponsor["level"][] = [
  "title", "presenting", "platinum", "gold", "silver", "bronze", "associate", "community",
];

const sponsorTierLabels: Record<Sponsor["level"], string> = {
  title: "Title Sponsor",
  presenting: "Presenting Sponsor",
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  associate: "Associate",
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

const sessionTypeLabels: Record<string, string> = {
  keynote: "Keynote",
  workshop: "Workshop",
  panel: "Panel",
  "breakout": "Breakout",
  "fireside-chat": "Fireside Chat",
  "lightning-talk": "Lightning Talk",
  demo: "Demo",
  "Q&A": "Q&A",
  roundtable: "Roundtable",
  networking: "Networking",
  break: "Break",
  lunch: "Lunch",
  other: "Session",
};

// ─── Countdown ──────────────────────────────────────────────────────────────────

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
    <div className="flex flex-col items-center">
      <span className="bg-foreground/5 border border-border rounded-md px-2.5 py-1 font-mono text-lg font-bold text-foreground tabular-nums">
        {pad(value)}
      </span>
      <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── Status & Announcement helpers ──────────────────────────────────────────────

function getEventStatus(event: EventData): { label: string; color: string } {
  if (event.status === "ongoing") return { label: "Live Now", color: "bg-success/10 text-success border-success/20" };
  if (event.status === "completed") return { label: "Completed", color: "bg-muted text-muted-foreground" };
  const now = new Date();
  const start = new Date(event.date);
  const end = event.endDate ? new Date(event.endDate) : start;
  if (now < start) return { label: "Upcoming", color: "bg-primary/10 text-primary" };
  if (now >= start && now <= end) return { label: "Live Now", color: "bg-success/10 text-success border-success/20" };
  return { label: "Completed", color: "bg-muted text-muted-foreground" };
}

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

// ─── Section heading ────────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

interface EventOverviewProps {
  event: EventData;
}

export const EventOverview: React.FC<EventOverviewProps> = ({ event }) => {
  const { toast } = useToast();
  const status = getEventStatus(event);
  const cd = useCountdown(event.date, event.endDate);

  // Announcements
  const [announcements, setAnnouncements] = useState<Notification[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  // Actions state
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactContent, setContactContent] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Description & organizer expansion
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isOrganizerDescExpanded, setIsOrganizerDescExpanded] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError(false);
      const res = await getNotifications({ eventId: event.id, limit: 20 });
      if (res.success && res.data) {
        setAnnouncements(res.data.notifications);
      }
    } catch {
      setAnnouncementsError(true);
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
    else {
      void navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied", description: "Event link copied to clipboard" });
    }
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
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    const start = new Date(event.date).toLocaleDateString("en-US", opts);
    if (event.endDate) {
      return `${start} – ${new Date(event.endDate).toLocaleDateString("en-US", opts)}`;
    }
    return start;
  };

  const attendeeCount = (event.registrationCount ?? 0) + 1; // +1 for organizer
  const hasSpeakers = !!(event.speakers && event.speakers.length > 0);
  const hasAgenda = !!(event.agenda && event.agenda.length > 0);
  const hasExhibitors = !!(event.exhibitors && event.exhibitors.length > 0);
  const hasSponsors = !!(event.sponsors && event.sponsors.length > 0);
  const hasFaqs = !!(event.faqs && event.faqs.length > 0);
  const hasRequirements = !!(event.requirements && event.requirements.length > 0) || !!event.ageRestriction;

  return (
    <div className="relative">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-6">

        {/* ═══════════════════════════════════════════════════════════════════
            1. EVENT HEADER — Image (3/4) + Details (1/4) side by side
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-5 mb-6">
          {/* ── Image (3/4 width) ── */}
          <div className="relative rounded-2xl overflow-hidden bg-muted min-h-[240px] sm:min-h-[320px] lg:min-h-[380px]">
            {event.image ? (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover absolute inset-0"
                style={{
                  objectPosition: event.imageFocalX != null && event.imageFocalY != null
                    ? `${event.imageFocalX}% ${event.imageFocalY}%`
                    : "center",
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Calendar className="w-16 h-16 text-primary/30" />
              </div>
            )}
            {/* Status badge */}
            <Badge className={`absolute top-4 left-4 ${status.color} border text-xs font-semibold z-10`}>
              {status.label}
            </Badge>
          </div>

          {/* ── Details (1/4 width) ── */}
          <div className="flex flex-col justify-between gap-4 py-1">
            {/* Top section — badges + title + meta */}
            <div className="space-y-3">
              {/* Category badges */}
              <div className="flex flex-wrap items-center gap-2">
                {event.category && (
                  <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                )}
                {event.type && event.type !== "Event" && (
                  <Badge variant="outline" className="text-xs capitalize">{event.type.replace(/-/g, " ")}</Badge>
                )}
                {event.hashtag && (
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">#{event.hashtag}</Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                {event.title}
              </h1>

              {/* Date + Time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{formatDateRange()}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{event.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {event.isOnline ? (
                    <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  <span>
                    {event.venue ?? event.location}
                    {event.address && event.venue && event.address !== event.venue && (
                      <span className="text-muted-foreground/60 ml-1">· {event.address}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom section — countdown + attendees */}
            <div className="space-y-4">
              {/* Countdown or Live status */}
              {!cd.isOver && (
                cd.isStarted ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                    </span>
                    <span className="text-success font-semibold text-sm">Happening Now</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Timer className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wide">Starts in</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {cd.days > 0 && (
                        <>
                          <CountdownUnit value={cd.days} label="days" />
                          <span className="text-muted-foreground/50 font-bold text-sm mb-4">:</span>
                        </>
                      )}
                      <CountdownUnit value={cd.hours} label="hrs" />
                      <span className="text-muted-foreground/50 font-bold text-sm mb-4">:</span>
                      <CountdownUnit value={cd.minutes} label="min" />
                      <span className="text-muted-foreground/50 font-bold text-sm mb-4">:</span>
                      <CountdownUnit value={cd.seconds} label="sec" />
                    </div>
                  </div>
                )
              )}

              {/* Attendee tally */}
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2">
                  {event.organizerAvatar ? (
                    <img
                      src={event.organizerAvatar}
                      alt={event.organizer ?? "Organizer"}
                      className="w-7 h-7 rounded-full border-2 border-background object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                      {event.organizer?.[0]?.toUpperCase() ?? "O"}
                    </div>
                  )}
                  {event.attendeeAvatars?.slice(0, 4).map((attendee) => (
                    attendee.avatar ? (
                      <img
                        key={attendee.id}
                        src={attendee.avatar}
                        alt={`${attendee.firstName ?? ''} ${attendee.lastName ?? ''}`.trim()}
                        className="w-7 h-7 rounded-full border-2 border-background object-cover"
                      />
                    ) : (
                      <div
                        key={attendee.id}
                        className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                      >
                        {attendee.firstName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )
                  ))}
                  {attendeeCount > 5 && (
                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      +{attendeeCount - 5}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{attendeeCount}</span>
                  <span className="ml-1">attending</span>
                  {event.capacity && (
                    <span> · {event.availableSlots ?? event.capacity} spots left</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. STICKY ACTION BAR
            ═══════════════════════════════════════════════════════════════════ */}
        {event.registrationId && (
          <div className="sticky top-12 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-card/95 backdrop-blur-sm border-y border-border">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 mr-auto">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-foreground">You're registered</span>
                {event.ticketType && (
                  <Badge variant="secondary" className="text-xs ml-1">{event.ticketType}</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleDownloadTicket} disabled={downloadingTicket}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {downloadingTicket ? "Downloading..." : "Ticket"}
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleAddToCalendar}>
                <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                Calendar
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleShare}>
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share
              </Button>
              {event.organizerId && (
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsContactOpen(true)}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  Contact
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            3. REGISTRATION DETAILS (compact)
            ═══════════════════════════════════════════════════════════════════ */}
        {event.registrationId && (
          <Card className="border-border/40 bg-card mb-6">
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {event.ticketType && (
                  <div className="flex items-start gap-2.5">
                    <Ticket className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ticket</p>
                      <p className="text-sm font-medium text-foreground">{event.ticketType}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <Hash className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Reg. ID</p>
                    <p className="font-mono text-xs font-medium text-foreground truncate">{event.registrationId}</p>
                  </div>
                </div>
                {event.backupCode && (
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Backup Code</p>
                      <p className="font-mono text-sm font-semibold text-foreground tracking-wider">{event.backupCode}</p>
                    </div>
                  </div>
                )}
                {event.registrationDate && (
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Registered</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(event.registrationDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Seat allocation */}
              {event.seat && (
                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Armchair className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Seat Allocation</span>
                    <Badge className="bg-primary/10 text-primary text-xs uppercase">{event.seat.seatType}</Badge>
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
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            4. ABOUT THIS EVENT
            ═══════════════════════════════════════════════════════════════════ */}
        {(event.fullDescription ?? event.description) && (() => {
          const descContent = event.fullDescription ?? event.description ?? "";
          const descTextLength = descContent.replace(/<[^>]*>/g, "").trim().length;
          if (descTextLength === 0) return null;
          const shouldTruncateDesc = descTextLength > 300;
          return (
            <section className="mb-8">
              <SectionHeading icon={Info} title="About This Event" />
              <Card className="border-border/40 bg-card">
                <CardContent className="p-5">
                  <div className="space-y-2">
                    <div className={shouldTruncateDesc && !isDescriptionExpanded ? "line-clamp-4" : ""}>
                      <RichTextContent
                        content={descContent}
                        className="text-sm text-muted-foreground leading-relaxed prose-sm max-w-none"
                      />
                    </div>
                    {shouldTruncateDesc && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="h-8 text-primary hover:text-primary/80 p-0"
                      >
                        {isDescriptionExpanded ? (
                          <>
                            Show Less
                            <ChevronDown className="w-4 h-4 ml-1 rotate-180" />
                          </>
                        ) : (
                          <>
                            See More
                            <ChevronDown className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      {event.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            5. ORGANIZER — Compact card (Eventbrite style)
            ═══════════════════════════════════════════════════════════════════ */}
        {event.organizer && (() => {
          const orgDescLength = event.organizerDescription ? event.organizerDescription.replace(/<[^>]*>/g, "").trim().length : 0;
          const shouldTruncateOrgDesc = orgDescLength > 200;
          return (
            <section className="mb-8">
              <SectionHeading icon={Building2} title="Organizer" />
              <Card className="border-border/40 bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={event.organizerAvatar}
                      name={event.organizer}
                      alt={event.organizer}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{event.organizer}</h3>
                      <p className="text-xs text-muted-foreground">Event Organizer</p>
                      {event.organizerDescription && orgDescLength > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className={shouldTruncateOrgDesc && !isOrganizerDescExpanded ? "line-clamp-3" : ""}>
                            <RichTextContent
                              content={event.organizerDescription}
                              className="text-sm text-muted-foreground leading-relaxed"
                            />
                          </div>
                          {shouldTruncateOrgDesc && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsOrganizerDescExpanded(!isOrganizerDescExpanded)}
                              className="h-7 text-xs text-primary hover:text-primary/80 p-0"
                            >
                              {isOrganizerDescExpanded ? (
                                <>
                                  Show Less
                                  <ChevronDown className="w-3.5 h-3.5 ml-1 rotate-180" />
                                </>
                              ) : (
                                <>
                                  See More
                                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                      {event.organizerId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 h-8 text-xs"
                          onClick={() => setIsContactOpen(true)}
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                          Contact Organizer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════════════════
            6. SPEAKERS
            ═══════════════════════════════════════════════════════════════════ */}
        {hasSpeakers && (
          <section className="mb-8">
            <SectionHeading icon={Mic2} title="Speakers" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(event.speakers ?? []).map((speaker, idx) => (
                <Card key={speaker.id ?? idx} className="border-border/40 bg-card overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {speaker.image ? (
                        <img
                          src={speaker.image}
                          alt={speaker.name}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mic2 className="w-6 h-6 text-primary/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">{speaker.name}</h4>
                        {speaker.title && (
                          <p className="text-xs text-muted-foreground mt-0.5">{speaker.title}</p>
                        )}
                        {speaker.company && (
                          <p className="text-xs text-primary/80 mt-0.5">{speaker.company}</p>
                        )}
                      </div>
                    </div>
                    {speaker.bio && stripHtml(speaker.bio).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
                        {stripHtml(speaker.bio)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            7. AGENDA PREVIEW — Top sessions + link to Schedule tab
            ═══════════════════════════════════════════════════════════════════ */}
        {hasAgenda && (
          <section className="mb-8">
            <SectionHeading icon={Calendar} title="Schedule Preview" />
            <Card className="border-border/40 bg-card">
              <CardContent className="p-5">
                <div className="space-y-3">
                  {(event.agenda ?? []).slice(0, 4).map((item, idx) => (
                    <div key={item.id ?? idx} className="flex items-start gap-3">
                      {/* Time column */}
                      <div className="flex-shrink-0 w-20 text-right">
                        <p className="text-xs font-mono font-medium text-primary">{item.startTime}</p>
                        <p className="text-[10px] text-muted-foreground">{item.endTime}</p>
                      </div>
                      {/* Vertical line */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        {idx < Math.min((event.agenda ?? []).length, 4) - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          {(item.sessionType || item.type) && (
                            <Badge variant="secondary" className="text-[10px]">
                              {sessionTypeLabels[(item.sessionType || item.type)!] ?? item.sessionType ?? item.type}
                            </Badge>
                          )}
                        </div>
                        {item.room && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.room}</p>
                        )}
                        {item.description && stripHtml(item.description).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{stripHtml(item.description)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {(event.agenda ?? []).length > 4 && (
                  <div className="pt-3 mt-3 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">
                      +{(event.agenda ?? []).length - 4} more sessions — switch to the <span className="font-medium text-primary">Schedule</span> tab to see the full agenda
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            8. EXHIBITORS
            ═══════════════════════════════════════════════════════════════════ */}
        {hasExhibitors && (
          <section className="mb-8">
            <SectionHeading icon={Building2} title="Exhibitors" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(event.exhibitors ?? []).map((exhibitor, idx) => (
                <Card key={exhibitor.id ?? idx} className="border-border/40 bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {exhibitor.logo ? (
                        <img
                          src={exhibitor.logo}
                          alt={exhibitor.name}
                          className="w-12 h-12 rounded-lg object-contain bg-muted p-1 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">{exhibitor.name}</h4>
                        {exhibitor.booth && (
                          <p className="text-xs text-primary mt-0.5">Booth: {exhibitor.booth}</p>
                        )}
                        {exhibitor.category && (
                          <Badge variant="secondary" className="text-[10px] mt-1">{exhibitor.category}</Badge>
                        )}
                      </div>
                    </div>
                    {exhibitor.description && stripHtml(exhibitor.description).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{stripHtml(exhibitor.description)}</p>
                    )}
                    {exhibitor.website && (
                      <a
                        href={exhibitor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit website
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            9. SPONSORS
            ═══════════════════════════════════════════════════════════════════ */}
        {hasSponsors && (
          <section className="mb-8">
            <SectionHeading icon={CheckCircle} title="Sponsors" />
            <Card className="border-border/40 bg-card">
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
                            href={s.website || '#'}
                            target={s.website ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="hover:opacity-75 transition-opacity"
                            title={s.name}
                          >
                            {s.logo ? (
                              <img src={s.logo} alt={s.name} className="h-10 w-auto object-contain" />
                            ) : (
                              <div className="h-10 px-4 bg-muted rounded-lg flex items-center">
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
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            10. FAQs — Accordion
            ═══════════════════════════════════════════════════════════════════ */}
        {hasFaqs && (
          <section className="mb-8">
            <SectionHeading icon={MessageCircle} title="Frequently Asked Questions" />
            <Card className="border-border/40 bg-card">
              <CardContent className="p-0 divide-y divide-border">
                {(event.faqs ?? []).map((faq, idx) => (
                  <div key={idx}>
                    <button
                      className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    >
                      <span className="text-sm font-medium text-foreground pr-4">{faq.question}</span>
                      {openFaqIndex === idx ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-5 pb-4 -mt-1">
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            11. REQUIREMENTS & RESTRICTIONS
            ═══════════════════════════════════════════════════════════════════ */}
        {hasRequirements && (
          <section className="mb-8">
            <SectionHeading icon={AlertCircle} title="Important Information" />
            <Card className="border-border/40 bg-card">
              <CardContent className="p-5 space-y-4">
                {event.ageRestriction && (
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Age Restriction</p>
                      <p className="text-sm text-muted-foreground">{event.ageRestriction}</p>
                    </div>
                  </div>
                )}
                {event.requirements && event.requirements.length > 0 && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Requirements</p>
                      <ul className="space-y-1.5">
                        {event.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {event.refundPolicy && event.refundPolicy !== "no_refunds" && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border">
                    <Ticket className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Refund Policy</p>
                      <p className="text-sm text-muted-foreground">
                        {event.refundPolicyText ?? event.refundPolicy.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            12. VENUE & MAP
            ═══════════════════════════════════════════════════════════════════ */}
        {!event.isOnline && (event.venue || event.location) && (
          <section className="mb-8">
            <SectionHeading icon={MapPin} title="Venue" />
            <Card className="border-border/40 bg-card overflow-hidden">
              <CardContent className="p-5 pb-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.venue ?? event.location}</p>
                    {event.venue && event.location && event.venue !== event.location && (
                      <p className="text-sm text-muted-foreground mt-0.5">{event.location}</p>
                    )}
                    {event.address && (
                      <p className="text-xs text-muted-foreground mt-1">{event.address}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex-shrink-0"
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
              <div className="relative h-[200px]">
                <EventMap
                  venue={event.venue || ""}
                  location={event.location}
                  coordinates={event.coordinates}
                />
              </div>
            </Card>
          </section>
        )}

        {/* Online event link */}
        {event.isOnline && event.onlineLink && (
          <section className="mb-8">
            <SectionHeading icon={Globe} title="Online Event" />
            <Card className="border-border/40 bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">This is an online event</p>
                      <p className="text-xs text-muted-foreground">Join via the link when the event starts</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => window.open(event.onlineLink, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            13. ANNOUNCEMENTS
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Announcements</h2>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7" onClick={handleMarkAllRead} disabled={markingRead}>
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void loadAnnouncements()} title="Refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <Card className="border-border/40 bg-card">
            <CardContent className="p-0">
              {announcementsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  Loading announcements...
                </div>
              ) : announcementsError ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">Could not load announcements</p>
                  <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => void loadAnnouncements()}>
                    Try again
                  </Button>
                </div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <Megaphone className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No announcements yet</p>
                  <p className="text-xs text-muted-foreground">The organizer will post updates here</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {announcements.map(a => (
                    <li
                      key={a.id}
                      className={`flex gap-3 px-5 py-4 transition-colors ${a.isRead ? "" : "bg-primary/[0.03]"}`}
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
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            14. POST-EVENT SURVEY — shown for completed events
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-8">
          <EventSurveyPrompt eventId={event.id} eventStatus={event.status} />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            15. SOCIAL LINKS — Footer row
            ═══════════════════════════════════════════════════════════════════ */}
        {event.socialLinks && Object.keys(event.socialLinks).length > 0 && (
          <section className="mb-8">
            <Card className="border-border/40 bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Follow this event</span>
                  <div className="flex items-center gap-3">
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
                          className="w-8 h-8 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                          title={cfg.label}
                        >
                          <Icon className="w-4 h-4" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTACT ORGANIZER DIALOG
          ═══════════════════════════════════════════════════════════════════ */}
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
                placeholder="Write your message to the organizer..."
                className="mt-2 min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactOpen(false)} disabled={sendingContact}>
              Cancel
            </Button>
            <Button onClick={handleContactOrganizer} disabled={sendingContact || !contactContent.trim()}>
              {sendingContact ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventOverview;
