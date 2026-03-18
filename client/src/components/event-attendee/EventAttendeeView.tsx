import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BadgeCheck,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventOverview } from "./EventOverview";
import { EventAgenda } from "./EventAgenda";
import { EventPeople } from "./EventPeople";
import { EventMyBadge } from "./EventMyBadge";

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

export interface FAQ {
  question: string;
  answer: string;
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
  imageFocalX?: number;
  imageFocalY?: number;
  category?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  registrationDate?: string;
  organizer?: string;
  organizerId?: string;
  organizerDescription?: string;
  organizerAvatar?: string;
  speakers?: Speaker[];
  sponsors?: Sponsor[];
  exhibitors?: Exhibitor[];
  agenda?: AgendaItem[];
  faqs?: FAQ[];
  socialLinks?: Record<string, string>;
  hashtag?: string;
  tags?: string[];
  // Event requirements & restrictions
  requirements?: string[];
  ageRestriction?: string;
  // Capacity & attendance
  capacity?: number;
  availableSlots?: number;
  registrationCount?: number;
  // Refund policy
  refundPolicy?: string;
  refundPolicyText?: string;
  // Location extras
  address?: string;
  coordinates?: { lat: number; lng: number };
  isOnline?: boolean;
  onlineLink?: string;
  // Registration & ticket data
  registrationId?: string;
  ticketType?: string;
  backupCode?: string;
  // Attendee avatars for social proof
  attendeeAvatars?: { id: string; firstName?: string; lastName?: string; avatar?: string }[];
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

// ─── Main component ───────────────────────────────────────────────────────────

export const EventAttendeeView: React.FC<EventAttendeeViewProps> = ({ event, user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

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
        return <EventOverview event={event} />;
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
      {/* Sticky sub-header (sits below UnifiedNavbar) */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
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

            {/* Right — Spacer for layout balance */}
            <div className="hidden lg:block" />
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

    </div>
  );
};

export default EventAttendeeView;
