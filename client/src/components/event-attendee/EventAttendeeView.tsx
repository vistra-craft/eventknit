import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BadgeCheck,
  ChevronLeft,
  Bell,
  MessageCircle,
  X,
  CheckCheck,
  Megaphone,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EventOverview } from "./EventOverview";
import { EventAgenda } from "./EventAgenda";
import { EventPeople } from "./EventPeople";
import { EventMyBadge } from "./EventMyBadge";
import {
  getNotifications,
  markAllAsRead,
  type Notification,
} from "@/lib/notification-api";

// ─── Type definitions ────────────────────────────────────────────────────────

export interface Speaker {
  id?: string;
  name: string;
  title: string;
  bio?: string;
  image?: string;
  company?: string;
}

export interface Sponsor {
  id?: string;
  name: string;
  level: 'platinum' | 'gold' | 'silver' | 'bronze' | 'title' | 'presenting' | 'community' | 'associate';
  logo?: string;
  website?: string;
  description?: string;
}

export interface Exhibitor {
  id?: string;
  name: string;
  description?: string;
  logo?: string;
  contactEmail?: string;
  booth?: string;
  category?: string;
  website?: string;
}

export interface AgendaItem {
  id?: string;
  title: string;
  description?: string;
  date?: string;
  startTime: string;
  endTime: string;
  location?: string;
  room?: string;
  type?: string;
  sessionType?: string;
  speakers?: string[];
  speakerIds?: string[];
  speakerDetails?: Speaker[];
}

export interface SeatInfo {
  seatIdentifier: string;
  sectionId?: string;
  rowLabel?: string;
  seatLabel?: string;
  seatType: string;
  reservationStatus: string;
}

export interface EventData {
  id: string;
  title: string;
  description?: string;
  fullDescription?: string;
  date: string;
  endDate?: string;
  time?: string;
  location: string;
  venue?: string;
  type: string;
  image?: string;
  category?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  registrationDate?: string;
  organizer?: string;
  organizerId?: string;
  organizerDescription?: string;
  speakers?: Speaker[];
  sponsors?: Sponsor[];
  exhibitors?: Exhibitor[];
  agenda?: AgendaItem[];
  socialLinks?: Record<string, string>;
  hashtag?: string;
  // Location extras
  address?: string;
  coordinates?: { lat: number; lng: number };
  isOnline?: boolean;
  onlineLink?: string;
  // Registration & ticket data
  registrationId?: string;
  ticketType?: string;
  backupCode?: string;
  // Seat allocation (populated from ticket endpoint)
  seat?: SeatInfo;
}

export interface User {
  name: string;
  email: string;
  initials: string;
  profileImage?: string;
  company?: string;
  title?: string;
}

interface EventAttendeeViewProps {
  event: EventData;
  user: User;
}

type TabKey = 'overview' | 'schedule' | 'people' | 'badge';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  available: boolean;
}

// ─── Notification priority icon helper ───────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  if (type.includes('CANCELLED') || type.includes('FAILED') || type.includes('SUSPENDED'))
    return <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />;
  if (type.includes('CONFIRMED') || type.includes('SUCCESS') || type.includes('APPROVED') || type.includes('ACTIVATED'))
    return <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />;
  if (type.includes('ANNOUNCEMENT') || type.includes('UPDATE') || type.includes('SYSTEM'))
    return <Megaphone className="w-4 h-4 text-primary flex-shrink-0" />;
  return <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Notifications slide-over panel ──────────────────────────────────────────

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAll: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  onNavigateToAll,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await getNotifications({ limit: 15 });
        if (!cancelled && res.success && res.data) {
          setNotifications(res.data.notifications);
        }
      } catch {
        // silently ignore — panel is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // silently ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-card shadow-elevated border-l border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary h-8"
                onClick={handleMarkAllRead}
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                All read
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Bell className="w-8 h-8 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map(notification => (
                <li
                  key={notification.id}
                  className={`flex gap-3 px-5 py-4 transition-colors ${
                    notification.isRead ? 'bg-background' : 'bg-primary/5'
                  }`}
                >
                  <NotificationIcon type={notification.type} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notification.isRead ? 'text-foreground' : 'font-semibold text-foreground'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <button
            onClick={() => { onClose(); onNavigateToAll(); }}
            className="w-full text-sm text-primary font-medium hover:text-primary/80 transition-colors text-center"
          >
            See all notifications
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const EventAttendeeView: React.FC<EventAttendeeViewProps> = ({ event, user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Fetch unread notification count on mount
  useEffect(() => {
    let cancelled = false;
    const loadUnread = async () => {
      try {
        const res = await getNotifications({ isRead: false, limit: 1 });
        if (!cancelled && res.success && res.data) {
          // Use total from response if available; fall back to array length
          const raw = res.data as { notifications: Notification[]; total?: number };
          setUnreadNotifCount(raw.total ?? raw.notifications.length);
        }
      } catch {
        // non-critical
      }
    };
    void loadUnread();
    return () => { cancelled = true; };
  }, []);

  const tabs = useMemo((): TabConfig[] => {
    const hasAgenda = !!(event.agenda && event.agenda.length > 0);
    const hasPeople = !!(
      (event.speakers && event.speakers.length > 0) ||
      (event.exhibitors && event.exhibitors.length > 0) ||
      (event.sponsors && event.sponsors.length > 0)
    );

    return [
      { key: 'overview' as TabKey, label: 'Overview', icon: LayoutDashboard, available: true },
      { key: 'schedule' as TabKey, label: 'Schedule', icon: CalendarDays, available: hasAgenda },
      { key: 'people' as TabKey, label: 'People', icon: Users, available: hasPeople },
      { key: 'badge' as TabKey, label: 'Badge', icon: BadgeCheck, available: true },
    ].filter(tab => tab.available) as TabConfig[];
  }, [event]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <EventOverview event={event} user={user} />;
      case 'schedule':
        return <EventAgenda event={event} user={user} />;
      case 'people':
        return (
          <EventPeople
            speakers={event.speakers ?? []}
            exhibitors={event.exhibitors ?? []}
            sponsors={event.sponsors ?? []}
          />
        );
      case 'badge':
        return <EventMyBadge event={event} user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header/Navbar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left — Back button & Event name */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/user/dashboard')}
                className="rounded-full"
                title="Back to Dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                {event.title}
              </span>
            </div>

            {/* Center — Navigation Tabs (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right — Icons & Profile */}
            <div className="flex items-center gap-2">
              {/* Messages — navigates to user dashboard messages section */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hidden sm:flex"
                title="Messages"
                onClick={() => navigate('/user/messages')}
              >
                <MessageCircle className="w-5 h-5" />
              </Button>

              {/* Notifications bell */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full relative"
                title="Notifications"
                onClick={() => setIsNotificationsOpen(true)}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </Button>

              <Avatar
                src={user.profileImage}
                name={user.name}
                alt={user.name}
                size="sm"
                className="cursor-pointer"
                onClick={() => navigate('/user/profile')}
                title="Profile"
              />
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden border-t border-border overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {renderTabContent()}
      </main>

      {/* Notifications Slide-over */}
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToAll={() => navigate('/user/notifications')}
      />
    </div>
  );
};

export default EventAttendeeView;
