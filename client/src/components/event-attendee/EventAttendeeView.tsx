import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventOverview } from "./EventOverview";
import { EventAgenda } from "./EventAgenda";
import { EventPeople } from "./EventPeople";

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

type TabKey = 'overview' | 'schedule' | 'people';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ElementType;
}

// ─── Main component ───────────────────────────────────────────────────────────

export const EventAttendeeView: React.FC<EventAttendeeViewProps> = ({ event, user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Only show tabs if there's content beyond the overview
  const extraTabs = useMemo((): TabConfig[] => {
    const result: TabConfig[] = [];
    if (event.agenda && event.agenda.length > 0) {
      result.push({ key: 'schedule', label: 'Schedule', icon: CalendarDays });
    }
    if (
      (event.speakers && event.speakers.length > 0) ||
      (event.exhibitors && event.exhibitors.length > 0) ||
      (event.sponsors && event.sponsors.length > 0)
    ) {
      result.push({ key: 'people', label: 'People', icon: Users });
    }
    return result;
  }, [event]);

  const hasTabs = extraTabs.length > 0;

  // All tabs including the implicit "Overview" when extra tabs exist
  const allTabs: TabConfig[] = hasTabs
    ? [{ key: 'overview' as TabKey, label: 'Overview', icon: CalendarDays }, ...extraTabs]
    : [];

  const renderContent = () => {
    switch (activeTab) {
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
      case 'overview':
      default:
        return <EventOverview event={event} user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky sub-header (sits below UnifiedNavbar) */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left — Back button & Event name */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/user/dashboard')}
                className="rounded-full flex-shrink-0"
                title="Back to Dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-sm font-medium text-foreground truncate">
                {event.title}
              </span>
            </div>

            {/* Center — Navigation Tabs (Desktop, only if extra tabs exist) */}
            {hasTabs && (
              <nav className="hidden lg:flex items-center gap-1">
                {allTabs.map((tab) => (
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
            )}

            <div className="hidden lg:block w-10" /> {/* Spacer for layout balance */}
          </div>
        </div>

        {/* Mobile Tab Bar (only if extra tabs exist) */}
        {hasTabs && (
          <div className="lg:hidden border-t border-border overflow-x-auto">
            <div className="flex items-center gap-1 px-4 py-2">
              {allTabs.map((tab) => (
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
        )}
      </header>

      {/* Main Content */}
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default EventAttendeeView;
