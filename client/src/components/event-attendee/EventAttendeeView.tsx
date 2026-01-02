import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  CalendarDays,
  Mic2,
  Building2,
  Heart,
  BadgeCheck,
  ChevronLeft,
  Search,
  Bell,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EventHome } from "./EventHome";
import { EventAgenda } from "./EventAgenda";
import { EventSpeakers } from "./EventSpeakers";
import { EventExhibitors } from "./EventExhibitors";
import { EventMyEvent } from "./EventMyEvent";
import { EventMyBadge } from "./EventMyBadge";

// Type definitions
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
  type?: 'keynote' | 'panel' | 'workshop' | 'networking' | 'break' | 'session';
  speakers?: string[];
  speakerDetails?: Speaker[];
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
  organizerDescription?: string;
  speakers?: Speaker[];
  sponsors?: Sponsor[];
  exhibitors?: Exhibitor[];
  agenda?: AgendaItem[];
  socialLinks?: Record<string, string>;
  hashtag?: string;
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

type TabKey = 'home' | 'agenda' | 'speakers' | 'exhibitors' | 'my-event' | 'my-badge';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  available: boolean;
}

export const EventAttendeeView: React.FC<EventAttendeeViewProps> = ({ event, user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // Determine which tabs are available based on event data
  const tabs = useMemo<TabConfig[]>(() => {
    const hasAgenda = event.agenda && event.agenda.length > 0;
    const hasSpeakers = event.speakers && event.speakers.length > 0;
    const hasExhibitors = event.exhibitors && event.exhibitors.length > 0;

    return [
      { key: 'home', label: 'Home', icon: Home, available: true },
      { key: 'agenda', label: 'Agenda', icon: CalendarDays, available: !!hasAgenda },
      { key: 'speakers', label: 'Speakers', icon: Mic2, available: !!hasSpeakers },
      { key: 'exhibitors', label: 'Exhibitors', icon: Building2, available: !!hasExhibitors },
      { key: 'my-event', label: 'My Event', icon: Heart, available: true },
      { key: 'my-badge', label: 'My Badge', icon: BadgeCheck, available: true },
    ].filter(tab => tab.available);
  }, [event]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <EventHome
            event={event}
            user={user}
            onNavigate={setActiveTab}
            availableTabs={tabs}
          />
        );
      case 'agenda':
        return <EventAgenda event={event} user={user} />;
      case 'speakers':
        return <EventSpeakers speakers={event.speakers || []} />;
      case 'exhibitors':
        return <EventExhibitors exhibitors={event.exhibitors || []} sponsors={event.sponsors} />;
      case 'my-event':
        return <EventMyEvent event={event} user={user} />;
      case 'my-badge':
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
            {/* Left - Back button & Event name */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/user/dashboard')}
                className="rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                  {event.title}
                </span>
              </div>
            </div>

            {/* Center - Navigation Tabs (Desktop) */}
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

            {/* Right - Icons & Profile */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                <MessageCircle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5" />
              </Button>
              <Avatar
                src={user.profileImage}
                name={user.name}
                alt={user.name}
                size="sm"
                className="cursor-pointer"
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
    </div>
  );
};

export default EventAttendeeView;
