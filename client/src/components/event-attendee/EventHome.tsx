import React from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Globe,
  Mic2,
  Building2,
  CalendarDays,
  Heart,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import type { EventData, User, Sponsor } from "./EventAttendeeView";

interface TabConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  available: boolean;
}

interface EventHomeProps {
  event: EventData;
  user: User;
  onNavigate: (tab: 'home' | 'agenda' | 'speakers' | 'exhibitors' | 'my-event' | 'my-badge') => void;
  availableTabs: TabConfig[];
}

// Quick action button config
const quickActionConfig = {
  speakers: { label: 'Speakers', icon: Mic2, color: 'bg-red-500 hover:bg-red-600' },
  exhibitors: { label: 'Exhibitors', icon: Building2, color: 'bg-teal-500 hover:bg-teal-600' },
  agenda: { label: 'Agenda', icon: CalendarDays, color: 'bg-green-500 hover:bg-green-600' },
  'my-event': { label: 'My Event', icon: Heart, color: 'bg-rose-500 hover:bg-rose-600' },
  'my-badge': { label: 'My Badge', icon: BadgeCheck, color: 'bg-purple-500 hover:bg-purple-600' },
};

// Sponsor tier order for display
const sponsorTierOrder: Sponsor['level'][] = [
  'title', 'presenting', 'platinum', 'gold', 'silver', 'bronze', 'associate', 'community'
];

const sponsorTierLabels: Record<Sponsor['level'], string> = {
  title: 'Title Sponsor',
  presenting: 'Presenting Sponsor',
  platinum: 'Platinum Sponsor',
  gold: 'Gold Sponsor',
  silver: 'Silver Sponsor',
  bronze: 'Bronze Sponsor',
  associate: 'Associate Sponsor',
  community: 'Community Partner',
};

export const EventHome: React.FC<EventHomeProps> = ({
  event,
  user,
  onNavigate,
  availableTabs,
}) => {
  // Group sponsors by tier
  const sponsorsByTier = React.useMemo(() => {
    if (!event.sponsors || event.sponsors.length === 0) return {};

    const grouped: Record<string, Sponsor[]> = {};
    event.sponsors.forEach(sponsor => {
      const tier = sponsor.level || 'associate';
      if (!grouped[tier]) grouped[tier] = [];
      grouped[tier].push(sponsor);
    });
    return grouped;
  }, [event.sponsors]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = () => {
    const startDate = new Date(event.date);
    const start = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (event.endDate) {
      const endDate = new Date(event.endDate);
      const end = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${start} - ${end}`;
    }

    return start;
  };

  // Get quick action tabs (excluding home)
  const quickActionTabs = availableTabs.filter(
    tab => tab.key !== 'home' && quickActionConfig[tab.key as keyof typeof quickActionConfig]
  );

  return (
    <div className="relative">
      {/* Hero Section with Event Image */}
      <div className="relative">
        {/* Background Image */}
        <div
          className="h-[300px] sm:h-[350px] bg-cover bg-center"
          style={{
            backgroundImage: event.image
              ? `url(${event.image})`
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="container mx-auto">
            <div className="max-w-4xl">
              {/* Event Title & Hashtag */}
              <div className="mb-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                  {event.title}
                </h1>
                {event.hashtag && (
                  <Badge className="bg-primary/90 text-white border-0 text-sm">
                    #{event.hashtag}
                  </Badge>
                )}
              </div>

              {/* Event Meta */}
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateRange()}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venue || event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - User Profile Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-0 shadow-card overflow-hidden">
              {/* Edit link */}
              <div className="absolute top-3 right-3">
                <Button variant="link" size="sm" className="text-xs text-muted-foreground">
                  Edit
                </Button>
              </div>

              <CardContent className="pt-8 pb-6 px-6 text-center">
                <Avatar
                  src={user.profileImage}
                  name={user.name}
                  alt={user.name}
                  size="lg"
                  className="mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                {user.title && (
                  <p className="text-sm text-muted-foreground">{user.title}</p>
                )}
                {user.company && (
                  <p className="text-sm text-muted-foreground">{user.company}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Quick Action Buttons */}
            <Card className="border-0 shadow-card overflow-hidden">
              <div className="bg-primary text-white text-center py-3">
                <span className="font-medium">
                  {event.hashtag ? `#${event.hashtag}` : event.title}
                </span>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {quickActionTabs.map((tab) => {
                    const config = quickActionConfig[tab.key as keyof typeof quickActionConfig];
                    if (!config) return null;

                    return (
                      <Button
                        key={tab.key}
                        onClick={() => onNavigate(tab.key as 'agenda' | 'speakers' | 'exhibitors' | 'my-event' | 'my-badge')}
                        className={`h-14 ${config.color} text-white font-medium rounded-lg`}
                      >
                        <config.icon className="w-5 h-5 mr-2" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sponsors Section */}
            {event.sponsors && event.sponsors.length > 0 && (
              <Card className="border-0 shadow-card">
                <CardContent className="p-6 space-y-6">
                  {sponsorTierOrder.map(tier => {
                    const sponsors = sponsorsByTier[tier];
                    if (!sponsors || sponsors.length === 0) return null;

                    return (
                      <div key={tier}>
                        <h3 className="text-sm font-semibold text-foreground mb-4">
                          {sponsorTierLabels[tier]}
                        </h3>
                        <div className="flex flex-wrap items-center gap-6">
                          {sponsors.map((sponsor, idx) => (
                            <a
                              key={sponsor.id || idx}
                              href={sponsor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block hover:opacity-80 transition-opacity"
                            >
                              {sponsor.logo ? (
                                <img
                                  src={sponsor.logo}
                                  alt={sponsor.name}
                                  className="h-10 sm:h-12 w-auto object-contain"
                                />
                              ) : (
                                <div className="h-10 sm:h-12 px-4 bg-muted rounded flex items-center justify-center">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {sponsor.name}
                                  </span>
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
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    {event.title}
                  </h2>

                  {/* Date & Time */}
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 mt-0.5 text-muted-foreground/70" />
                      <div>
                        <p>From {formatDate(event.date)}{event.time && ` ${event.time}`}</p>
                        {event.endDate && (
                          <p>To {formatDate(event.endDate)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Globe className="w-4 h-4 mt-0.5 text-muted-foreground/70" />
                      <p>Dates are displayed in your time zone</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground/70" />
                      <div>
                        <p className="font-medium text-foreground">{event.venue || event.location}</p>
                        {event.venue && event.location && event.venue !== event.location && (
                          <p>{event.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {(event.fullDescription || event.description) && (
                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {event.fullDescription || event.description}
                    </p>
                  </div>
                )}

                {/* Social Links */}
                {event.socialLinks && Object.keys(event.socialLinks).length > 0 && (
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    {Object.entries(event.socialLinks).map(([platform, url]) => {
                      if (!url) return null;
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventHome;
