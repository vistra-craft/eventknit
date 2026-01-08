import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState';
import { Calendar, Clock, MapPin, Users, Mic, Coffee, Utensils, Loader2 } from 'lucide-react';
import { getEventById } from '@/lib/event-api';

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
  company?: string;
  designation?: string;
}

interface Registration {
  ticketId?: string;
  status?: string;
}

interface DashboardAgendaProps {
  eventData: EventData;
  user: User;
  registration?: Registration;
}

interface AgendaItem {
  id: string;
  date?: string; // Date for multi-day events
  time: string;
  title: string;
  type: 'keynote' | 'panel' | 'workshop' | 'break' | 'meal' | 'networking';
  speaker?: string;
  location: string;
  description?: string;
  duration: string;
}

const DashboardAgenda: React.FC<DashboardAgendaProps> = ({ eventData }) => {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventLocation, setEventLocation] = useState(eventData.location || '');

  // Calculate duration from start and end time
  const calculateDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return '';
    
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins} min`;
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
      }
    } catch {
      return '';
    }
  };

  // Infer agenda item type from title/description
  const inferType = (title: string, description?: string): AgendaItem['type'] => {
    const lowerTitle = title.toLowerCase();
    const lowerDesc = (description || '').toLowerCase();
    const combined = `${lowerTitle} ${lowerDesc}`;

    if (combined.includes('keynote') || combined.includes('opening') || combined.includes('closing')) {
      return 'keynote';
    }
    if (combined.includes('panel') || combined.includes('discussion')) {
      return 'panel';
    }
    if (combined.includes('workshop') || combined.includes('training') || combined.includes('session')) {
      return 'workshop';
    }
    if (combined.includes('break') || combined.includes('coffee') || combined.includes('tea')) {
      return 'break';
    }
    if (combined.includes('lunch') || combined.includes('dinner') || combined.includes('meal')) {
      return 'meal';
    }
    if (combined.includes('networking') || combined.includes('reception') || combined.includes('social')) {
      return 'networking';
    }
    return 'workshop'; // Default
  };

  // Transform organizer agenda to display format
  const transformAgenda = useCallback((organizerAgenda: Array<Record<string, unknown>>): AgendaItem[] => {
    if (!organizerAgenda || !Array.isArray(organizerAgenda)) {
      return [];
    }

    return organizerAgenda.map((item, index) => {
      const startTime = typeof item.startTime === 'string' ? item.startTime : '';
      const endTime = typeof item.endTime === 'string' ? item.endTime : '';
      const time = startTime ? startTime.substring(0, 5) : ''; // Format as HH:MM
      const date = typeof item.date === 'string' ? item.date : undefined;
      
      // Map speakers array to string
      let speakerString = '';
      const speakers = Array.isArray(item.speakers) ? item.speakers : [];
      if (speakers.length > 0) {
        speakerString = speakers
          .map((s: unknown) => {
            if (typeof s === 'string') return s;
            if (s && typeof s === 'object' && 'name' in s) {
              const speaker = s as { name?: string };
              return speaker.name;
            }
            return '';
          })
          .filter(Boolean)
          .join(', ');
      }

      return {
        id: `agenda-${index}`,
        date,
        time,
        title: typeof item.title === 'string' ? item.title : 'Untitled Session',
        type: inferType(
          typeof item.title === 'string' ? item.title : '',
          typeof item.description === 'string' ? item.description : undefined
        ),
        speaker: speakerString || undefined,
        location: eventLocation,
        description: typeof item.description === 'string' ? item.description : undefined,
        duration: calculateDuration(startTime, endTime),
      };
    }).sort((a, b) => {
      // Sort by date first (if available), then by time
      if (a.date && b.date) {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
      } else if (a.date) return -1;
      else if (b.date) return 1;
      
      // Sort by time
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  }, [eventLocation]);

  useEffect(() => {
    const fetchAgenda = async () => {
      if (!eventData?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getEventById(eventData.id.toString());
        
        if (response.success && response.data?.event) {
          const event = response.data.event;
          
          // Update location
          if (event.location) {
            setEventLocation(event.location);
          }

          // Transform and set agenda
          if (event.agenda && Array.isArray(event.agenda)) {
            const transformed = transformAgenda(event.agenda);
            setAgendaItems(transformed);
          } else {
            setAgendaItems([]);
          }
        }
      } catch (error) {
        console.error('Error fetching agenda:', error);
        setAgendaItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgenda();
  }, [eventData?.id, transformAgenda]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'keynote': return <Mic className="w-4 h-4" />;
      case 'panel': return <Users className="w-4 h-4" />;
      case 'workshop': return <Calendar className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'meal': return <Utensils className="w-4 h-4" />;
      case 'networking': return <Users className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'keynote': return 'bg-purple-100 text-purple-800';
      case 'panel': return 'bg-blue-100 text-blue-800';
      case 'workshop': return 'bg-green-100 text-green-800';
      case 'break': return 'bg-yellow-100 text-yellow-800';
      case 'meal': return 'bg-orange-100 text-orange-800';
      case 'networking': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const groupAgendaByDateAndTime = () => {
    const groups: { [key: string]: AgendaItem[] } = {};
    agendaItems.forEach(item => {
      // Group by date (if available) and time, or just time if no date
      // Use | separator to avoid conflicts with date formats that might contain dashes
      const groupKey = item.date ? `${item.date}|${item.time}` : item.time;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    return groups;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const agendaGroups = groupAgendaByDateAndTime();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          
          {/* Event Card Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={eventData.image} 
                      alt={eventData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{eventData.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{eventData.location}</p>
                    <p className="text-muted-foreground text-sm">{eventData.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-card rounded-2xl shadow-lg border border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-foreground">Event Agenda</CardTitle>
                <p className="text-muted-foreground">
                  Complete schedule of sessions, workshops, and networking opportunities.
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading agenda...</p>
                  </div>
                ) : agendaItems.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(agendaGroups).map(([groupKey, items]) => {
                      // Extract date and time from group key (format: "date-time" or just "time")
                      const parts = groupKey.split('|');
                      const displayDate = parts[0] && parts[0] !== 'undefined' ? formatDate(parts[0]) : null;
                      const displayTime = parts[1] || items[0]?.time || '';
                      
                      return (
                      <div key={groupKey} className="space-y-3">
                        {displayDate && (
                          <div className="mb-2">
                            <h3 className="text-lg font-bold text-foreground">{displayDate}</h3>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{displayTime}</span>
                          </div>
                          <div className="flex-1 h-px bg-border"></div>
                        </div>
                      
                      <div className="space-y-3 ml-6">
                        {items.map((item) => (
                          <Card key={item.id} className="bg-muted/30 border border-border">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className={getTypeColor(item.type)}>
                                        <span className="flex items-center gap-1">
                                          {getTypeIcon(item.type)}
                                          {item.type.toUpperCase()}
                                        </span>
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">{item.duration}</span>
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                                    {item.speaker && (
                                      <p className="text-sm text-muted-foreground mb-2">
                                        Speaker: {item.speaker}
                                      </p>
                                    )}
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{item.location}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="Agenda Coming Soon"
                    description="The detailed agenda will be published closer to the event date. Check back soon for session schedules and activities."
                    size="sm"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAgenda;