import React, { useMemo, useState } from "react";
import { Clock, MapPin, Mic, Users, Coffee, Utensils, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventData, User, AgendaItem, Speaker } from "./EventAttendeeView";

interface EventAgendaProps {
  event: EventData;
  user: User;
}

// Session type configuration
const sessionTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  keynote: { icon: Mic, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  panel: { icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  workshop: { icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-100' },
  session: { icon: Calendar, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  break: { icon: Coffee, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  networking: { icon: Users, color: 'text-pink-600', bgColor: 'bg-pink-100' },
};

// Infer session type from title/description
const inferSessionType = (title: string, description?: string): string => {
  const text = `${title} ${description || ''}`.toLowerCase();

  if (text.includes('keynote') || text.includes('opening') || text.includes('closing')) return 'keynote';
  if (text.includes('panel') || text.includes('discussion')) return 'panel';
  if (text.includes('workshop') || text.includes('training')) return 'workshop';
  if (text.includes('break') || text.includes('coffee') || text.includes('tea')) return 'break';
  if (text.includes('lunch') || text.includes('dinner') || text.includes('meal')) return 'break';
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
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Date Tabs - Only show for multi-day events */}
      {eventDates.length > 1 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {eventDates.map((date) => {
              const formatted = formatDateTab(date);
              const isActive = date === selectedDate;

              return (
                <Button
                  key={date}
                  variant={isActive ? 'default' : 'outline'}
                  className={cn(
                    'flex flex-col items-center min-w-[80px] h-auto py-3 px-4',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="text-xs font-medium uppercase">{formatted.day}</span>
                  <span className="text-2xl font-bold">{formatted.date}</span>
                  <span className="text-xs">{formatted.month}</span>
                </Button>
              );
            })}
          </div>
          {selectedDate && (
            <p className="text-sm text-muted-foreground mt-3">
              {formatFullDate(selectedDate)}
            </p>
          )}
        </div>
      )}

      {/* Agenda Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedAgenda).map(([time, items]) => (
          <div key={time} className="relative">
            {/* Time Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{time}</span>
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Sessions */}
            <div className="space-y-4 pl-4 border-l-2 border-muted ml-4">
              {items.map((item, idx) => {
                const type = item.type || inferSessionType(item.title, item.description);
                const config = sessionTypeConfig[type] || sessionTypeConfig.session;
                const TypeIcon = config.icon;
                const duration = calculateDuration(item.startTime, item.endTime);
                const speakers = getSpeakerNames(item);

                return (
                  <Card key={item.id || idx} className="border-0 shadow-card hover:shadow-card-hover transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Type Icon */}
                        <div className={cn('p-2 rounded-lg', config.bgColor)}>
                          <TypeIcon className={cn('w-5 h-5', config.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {item.title}
                              </h3>
                              {speakers && (
                                <p className="text-sm text-primary mt-0.5">
                                  {speakers}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </Badge>
                              {duration && (
                                <span className="text-xs text-muted-foreground">
                                  {duration}
                                </span>
                              )}
                            </div>
                          </div>

                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {item.description}
                            </p>
                          )}

                          {item.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{item.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventAgenda;
