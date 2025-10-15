import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Calendar, Clock, MapPin, Users, Mic, Coffee, Utensils } from 'lucide-react';

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
  time: string;
  title: string;
  type: 'keynote' | 'panel' | 'workshop' | 'break' | 'meal' | 'networking';
  speaker?: string;
  location: string;
  description?: string;
  duration: string;
}

const DashboardAgenda: React.FC<DashboardAgendaProps> = ({ eventData }) => {
  // Mock agenda data
  const agendaItems: AgendaItem[] = [
    {
      id: '1',
      time: '08:00',
      title: 'Registration & Welcome Coffee',
      type: 'break',
      location: 'Main Lobby',
      duration: '60 min'
    },
    {
      id: '2',
      time: '09:00',
      title: 'Opening Keynote: The Future of Digital Commerce',
      type: 'keynote',
      speaker: 'Dr. Sarah Johnson',
      location: 'Main Auditorium',
      description: 'Exploring emerging trends and technologies shaping the future of digital commerce.',
      duration: '45 min'
    },
    {
      id: '3',
      time: '09:45',
      title: 'Panel: E-commerce Innovation in Africa',
      type: 'panel',
      speaker: 'Moderator: James Kariuki',
      location: 'Stage 1',
      description: 'Panel discussion on innovative e-commerce solutions across African markets.',
      duration: '60 min'
    },
    {
      id: '4',
      time: '10:45',
      title: 'Coffee Break',
      type: 'break',
      location: 'Exhibition Hall',
      duration: '30 min'
    },
    {
      id: '5',
      time: '11:15',
      title: 'Workshop: Building Scalable Payment Systems',
      type: 'workshop',
      speaker: 'Tech Team Lead',
      location: 'Workshop Room A',
      description: 'Hands-on workshop on designing and implementing scalable payment infrastructure.',
      duration: '90 min'
    },
    {
      id: '6',
      time: '12:45',
      title: 'Lunch & Networking',
      type: 'meal',
      location: 'Dining Hall',
      duration: '75 min'
    },
    {
      id: '7',
      time: '14:00',
      title: 'Fireside Chat: Digital Transformation Success Stories',
      type: 'panel',
      speaker: 'CEO Panel',
      location: 'Stage 2',
      description: 'Intimate conversation with industry leaders about their digital transformation journeys.',
      duration: '45 min'
    },
    {
      id: '8',
      time: '14:45',
      title: 'Networking Break',
      type: 'networking',
      location: 'Exhibition Hall',
      duration: '30 min'
    },
    {
      id: '9',
      time: '15:15',
      title: 'Workshop: Mobile Commerce Best Practices',
      type: 'workshop',
      speaker: 'Mobile Expert',
      location: 'Workshop Room B',
      description: 'Learn the latest strategies for optimizing mobile commerce experiences.',
      duration: '90 min'
    },
    {
      id: '10',
      time: '16:45',
      title: 'Closing Keynote: Building Sustainable Digital Ecosystems',
      type: 'keynote',
      speaker: 'Prof. Michael Chen',
      location: 'Main Auditorium',
      description: 'Creating sustainable and inclusive digital commerce ecosystems for the future.',
      duration: '45 min'
    },
    {
      id: '11',
      time: '17:30',
      title: 'Closing Remarks & Networking Reception',
      type: 'networking',
      location: 'Main Lobby',
      duration: '90 min'
    }
  ];

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

  const groupAgendaByTime = () => {
    const groups: { [key: string]: AgendaItem[] } = {};
    agendaItems.forEach(item => {
      const timeSlot = item.time;
      if (!groups[timeSlot]) {
        groups[timeSlot] = [];
      }
      groups[timeSlot].push(item);
    });
    return groups;
  };

  const agendaGroups = groupAgendaByTime();

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
                <div className="space-y-6">
                  {Object.entries(agendaGroups).map(([timeSlot, items]) => (
                    <div key={timeSlot} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{timeSlot}</span>
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
                  ))}
                </div>

                {/* Empty State */}
                {agendaItems.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Agenda Coming Soon</h3>
                    <p className="text-muted-foreground">
                      The detailed agenda will be published closer to the event date.
                    </p>
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

export default DashboardAgenda;