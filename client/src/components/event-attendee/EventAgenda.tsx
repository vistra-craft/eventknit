import React, { useMemo, useState } from "react";
import { Clock, MapPin, Mic, Users, Coffee, Calendar, Zap, Monitor, MessageCircle, Award, Music, PartyPopper, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { cn } from "@/lib/utils";
import type { EventData, User, AgendaItem } from "./EventAttendeeView";

interface EventAgendaProps {
  event: EventData;
  user: User;
}

// Session type configuration — covers all creation form types + fallback
// Colors use dark-mode-safe patterns: opacity-based backgrounds + dual-mode text
const sessionTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  keynote: { icon: Mic, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10' },
  panel: { icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
  workshop: { icon: Calendar, color: 'text-success', bgColor: 'bg-success/10' },
  breakout: { icon: Users, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/10' },
  'fireside-chat': { icon: MessageCircle, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
  'lightning-talk': { icon: Zap, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500/10' },
  demo: { icon: Monitor, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10' },
  qa: { icon: MessageCircle, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/10' },
  roundtable: { icon: Users, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/10' },
  tutorial: { icon: Calendar, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  'opening-ceremony': { icon: PartyPopper, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-500/10' },
  'closing-ceremony': { icon: Award, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-500/10' },
  awards: { icon: Award, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  entertainment: { icon: Music, color: 'text-fuchsia-600 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-500/10' },
  social: { icon: Users, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10' },
  networking: { icon: Users, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-500/10' },
  break: { icon: Coffee, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  lunch: { icon: Coffee, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
  registration: { icon: Calendar, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  session: { icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-500/10' },
  other: { icon: Calendar, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

// Resolve session type: prefer explicit sessionType/type field, fall back to inference
const resolveSessionType = (item: AgendaItem): string => {
  // Use explicit sessionType from creation form first
  const explicit = item.sessionType || item.type;
  if (explicit && sessionTypeConfig[explicit]) return explicit;
  if (explicit) return 'session'; // custom type — use generic session styling

  // Fallback: infer from title/description
  const text = `${item.title} ${item.description || ''}`.toLowerCase();
  if (text.includes('keynote') || text.includes('opening') || text.includes('closing')) return 'keynote';
  if (text.includes('panel') || text.includes('discussion')) return 'panel';
  if (text.includes('workshop') || text.includes('training')) return 'workshop';
  if (text.includes('break') || text.includes('coffee') || text.includes('tea')) return 'break';
  if (text.includes('lunch') || text.includes('dinner') || text.includes('meal')) return 'lunch';
  if (text.includes('networking') || text.includes('reception') || text.includes('social')) return 'networking';
  return 'session';
};

// Calculate duration between two times
const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '';

  try {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } catch {
    return '';
  }
};

// Format time for display
const formatTime = (time: string): string => {
  if (!time) return '';
  return time.substring(0, 5); // HH:MM format
};

// Get speaker names from agenda item
const getSpeakerNames = (item: AgendaItem): string => {
  if (item.speakerDetails && item.speakerDetails.length > 0) {
    return item.speakerDetails.map(s => s.name).join(', ');
  }
  if (item.speakers && item.speakers.length > 0) {
    return item.speakers.join(', ');
  }
  return '';
};

// ─── Expandable agenda item ────────────────────────────────────────────────────

function AgendaItemCard({ item, idx }: { item: AgendaItem; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const type = resolveSessionType(item);
  const config = sessionTypeConfig[type] || sessionTypeConfig.session;
  const TypeIcon = config.icon;
  const duration = calculateDuration(item.startTime, item.endTime);
  const speakers = getSpeakerNames(item);
  const hasDescription = !!item.description;

  return (
    <Card key={item.id || idx} variant="github" className="hover:shadow-md hover:border-primary/30 transition-all">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Type Icon */}
          <div className={cn('p-1.5 rounded-md flex-shrink-0', config.bgColor)}>
            <TypeIcon className={cn('w-4 h-4', config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <h3 className="font-medium text-foreground text-sm">
                  {item.title}
                </h3>
                {speakers && (
                  <p className="text-xs text-muted-foreground">
                    {speakers}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Badge>
                {duration && (
                  <span className="text-[10px] text-muted-foreground">
                    {duration}
                  </span>
                )}
              </div>
            </div>

            {hasDescription && (
              <>
                <div className={cn(!expanded && 'line-clamp-2')}>
                  <RichTextContent
                    content={item.description!}
                    className="text-xs text-muted-foreground"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-0 text-xs text-primary hover:text-primary/80 mt-1 gap-1"
                  onClick={() => setExpanded(e => !e)}
                >
                  {expanded ? (
                    <><ChevronUp className="w-3 h-3" /> Show less</>
                  ) : (
                    <><ChevronDown className="w-3 h-3" /> See more</>
                  )}
                </Button>
              </>
            )}

            {(item.room || item.location) && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                <MapPin className="w-2.5 h-2.5" />
                <span>{item.room || item.location}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const EventAgenda: React.FC<EventAgendaProps> = ({ event }) => {
  // Get unique dates from agenda items
  const eventDates = useMemo(() => {
    if (!event.agenda || event.agenda.length === 0) return [];

    const dates = new Set<string>();

    // First check if agenda items have their own dates
    event.agenda.forEach(item => {
      if (item.date) {
        dates.add(item.date);
      }
    });

    // If no item-level dates, use event start/end dates to generate date range
    if (dates.size === 0) {
      const startDate = new Date(event.date);
      const endDate = event.endDate ? new Date(event.endDate) : startDate;

      const current = new Date(startDate);
      while (current <= endDate) {
        dates.add(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    }

    return Array.from(dates).sort();
  }, [event.agenda, event.date, event.endDate]);

  const [selectedDate, setSelectedDate] = useState<string>(eventDates[0] || '');

  // Group and filter agenda by selected date
  const filteredAgenda = useMemo(() => {
    if (!event.agenda) return [];

    // If multi-day with date tabs, filter by selected date
    if (eventDates.length > 1 && selectedDate) {
      return event.agenda
        .filter(item => item.date === selectedDate || !item.date)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }

    // Single day - show all sorted by time
    return [...event.agenda].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [event.agenda, eventDates, selectedDate]);

  // Group agenda items by time slot
  const groupedAgenda = useMemo(() => {
    const groups: Record<string, AgendaItem[]> = {};

    filteredAgenda.forEach(item => {
      const timeKey = formatTime(item.startTime);
      if (!groups[timeKey]) groups[timeKey] = [];
      groups[timeKey].push(item);
    });

    return groups;
  }, [filteredAgenda]);

  const formatDateTab = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!event.agenda || event.agenda.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-md mx-auto">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Agenda Coming Soon</h2>
          <p className="text-muted-foreground">
            The detailed agenda will be published closer to the event date. Check back soon for session schedules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
      {/* Date Tabs - Only show for multi-day events */}
      {eventDates.length > 1 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {eventDates.map((date) => {
              const formatted = formatDateTab(date);
              const isActive = date === selectedDate;

              return (
                <Button
                  key={date}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'flex flex-col items-center min-w-[60px] h-auto py-2 px-3',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="text-[10px] font-medium uppercase">{formatted.day}</span>
                  <span className="text-lg font-bold">{formatted.date}</span>
                  <span className="text-[10px]">{formatted.month}</span>
                </Button>
              );
            })}
          </div>
          {selectedDate && (
            <p className="text-xs text-muted-foreground mt-2">
              {formatFullDate(selectedDate)}
            </p>
          )}
        </div>
      )}

      {/* Agenda Timeline - Compact */}
      <div className="space-y-4">
        {Object.entries(groupedAgenda).map(([time, items]) => (
          <div key={time} className="relative">
            {/* Time Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground text-sm">{time}</span>
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Sessions */}
            <div className="space-y-2 pl-3 border-l-2 border-muted ml-3">
              {items.map((item, idx) => (
                <AgendaItemCard key={item.id || idx} item={item} idx={idx} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventAgenda;
