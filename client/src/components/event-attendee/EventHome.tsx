import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Clock,
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { RichTextContent } from "@/components/ui/RichTextContent";
import type { EventData, User, Sponsor } from "./EventAttendeeView";

interface EventHomeProps {
  event: EventData;
  user: User;
}

// ─── Sponsor helpers ──────────────────────────────────────────────────────────

const sponsorTierOrder: Sponsor['level'][] = [
  'title', 'presenting', 'platinum', 'gold', 'silver', 'bronze', 'associate', 'community',
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

const socialPlatformConfig: Record<string, { icon: React.ElementType; label: string }> = {
  twitter: { icon: Twitter, label: 'Twitter' },
  x: { icon: Twitter, label: 'X (Twitter)' },
  facebook: { icon: Facebook, label: 'Facebook' },
  instagram: { icon: Instagram, label: 'Instagram' },
  linkedin: { icon: Linkedin, label: 'LinkedIn' },
  youtube: { icon: Youtube, label: 'YouTube' },
  github: { icon: Github, label: 'GitHub' },
  website: { icon: Globe2, label: 'Website' },
};

// ─── Countdown hook ───────────────────────────────────────────────────────────

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
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, isStarted: false, isOver: false };
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

// ─── Countdown strip component ────────────────────────────────────────────────

interface CountdownStripProps {
  event: EventData;
}

function CountdownStrip({ event }: CountdownStripProps) {
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

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex flex-col items-center min-w-[36px]">
      <span className="bg-foreground/5 border border-border rounded-md px-2 py-0.5 font-mono text-sm font-bold text-foreground tabular-nums">
        {pad(value)}
      </span>
      <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const EventHome: React.FC<EventHomeProps> = ({
  event,
  user,
}) => {
  const navigate = useNavigate();

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

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const formatDateRange = (): string => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const start = new Date(event.date).toLocaleDateString('en-US', opts);
    if (event.endDate) {
      const end = new Date(event.endDate).toLocaleDateString('en-US', opts);
      return `${start} – ${end}`;
    }
    return start;
  };


  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <div className="relative rounded-xl overflow-hidden">
          <div
            className="h-[250px] sm:h-[300px] bg-cover bg-center"
            style={{
              backgroundImage: event.image
                ? `url(${event.image})`
                : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-4xl">
              <div className="mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.title}</h1>
                {event.hashtag && (
                  <Badge className="bg-primary/90 text-white border-0 text-sm">
                    #{event.hashtag}
                  </Badge>
                )}
              </div>
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
                  <span>{event.venue ?? event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="github" className="sticky top-24 overflow-hidden">
              <div className="absolute top-3 right-3">
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => navigate('/user/profile')}
                  title="Edit Profile"
                >
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

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">

            {/* Countdown / Live status strip */}
            <CountdownStrip event={event} />

            {/* Sponsors */}
            {event.sponsors && event.sponsors.length > 0 && (
              <Card variant="github">
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
                              key={sponsor.id ?? idx}
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
            <Card variant="github">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-0.5 text-muted-foreground/70" />
                    <div>
                      <p>From {formatDate(event.date)}{event.time && ` · ${event.time}`}</p>
                      {event.endDate && <p>To {formatDate(event.endDate)}</p>}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 mt-0.5 text-muted-foreground/70" />
                    <p>Dates are displayed in your local time zone</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground/70" />
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
                    content={event.fullDescription ?? event.description ?? ''}
                    className="text-sm text-muted-foreground"
                  />
                )}

                {event.socialLinks && Object.keys(event.socialLinks).length > 0 && (
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    {Object.entries(event.socialLinks).map(([platform, url]) => {
                      if (!url) return null;
                      const platformKey = platform.toLowerCase();
                      const cfg = socialPlatformConfig[platformKey] ?? {
                        icon: ExternalLink,
                        label: platform.charAt(0).toUpperCase() + platform.slice(1),
                      };
                      const PlatformIcon = cfg.icon;
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title={cfg.label}
                        >
                          <PlatformIcon className="w-4 h-4" />
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
