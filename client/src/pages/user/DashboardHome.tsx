import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Mic,
  Users2,
  Calendar as CalendarIcon,
  FileText,
  Badge as BadgeIcon,
  ArrowLeft,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { getUserRegisteredEvents } from "../../lib/event-api";

interface EventData {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
  venue?: string;
  description?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  category?: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
}

interface Registration {
  ticketId?: string;
  status?: string;
}

interface DashboardHomeProps {
  eventData?: EventData;
  user: User;
  registration?: Registration;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [userEvents, setUserEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserEvents = async () => {
      try {
        setLoading(true);
        const response = await getUserRegisteredEvents();
        if (response.success && response.data.events) {
          setUserEvents(response.data.events.map(event => ({
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            type: event.type,
            image: event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
            registrationDate: event.registrationDate,
            venue: event.venue,
            description: event.description,
            status: event.status,
            category: event.category,
          })));
        }
      } catch (error) {
        console.error("Error fetching user events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'ongoing': return <Users className="w-4 h-4" />;
      case 'completed': return <Star className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  // If an event is selected, show event details
  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            
            {/* Left Sidebar - User Profile */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl shadow-lg p-6 sticky top-24 border border-border">
                <div className="text-right mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setSelectedEvent(null)}
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back to Events
                  </Button>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <span className="text-2xl font-bold text-primary">{user.initials}</span>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-card"></div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mb-1">{user.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">Software Engineer</p>
                  <p className="text-sm text-muted-foreground">Dukapaq Ltd.</p>
                </div>
              </div>
            </div>

            {/* Main Content - Event Details */}
            <div className="lg:col-span-3">
              {/* Event Banner */}
              <div className="relative rounded-2xl p-8 mb-8 text-white overflow-hidden">
                <img 
                  src={selectedEvent.image}
                  alt="Event background"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10">
                  <div className="mb-4">
                    <h1 className="text-3xl font-bold mb-2">{selectedEvent.title}</h1>
                    <p className="text-white/80 text-sm">{selectedEvent.category}</p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-xl font-semibold mb-2">{selectedEvent.date}</p>
                    <p className="text-white/90">{selectedEvent.location}</p>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg px-4 py-2 inline-block">
                    <span className="text-white font-medium">#{selectedEvent.title.replace(/\s+/g, '')}</span>
                  </div>
                </div>
              </div>

              {/* Event Features Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-8">
                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => window.location.href = '/user/dashboard?section=speakers'}
                >
                  <Mic className="w-5 h-5" />
                  <span className="font-medium text-xs sm:text-sm">Speakers</span>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => window.location.href = '/user/dashboard?section=exhibitors'}
                >
                  <Users2 className="w-5 h-5" />
                  <span className="font-medium text-xs sm:text-sm">Exhibitors</span>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => window.location.href = '/user/dashboard?section=agenda'}
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span className="font-medium text-xs sm:text-sm">Agenda</span>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => window.location.href = '/user/dashboard?section=badge'}
                >
                  <BadgeIcon className="w-5 h-5" />
                  <span className="font-medium text-xs sm:text-sm">My Badge</span>
                </Button>

                <Button 
                  variant="outline"
                  className="h-16 bg-card hover:bg-primary hover:text-primary-foreground border-border rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200"
                  onClick={() => window.location.href = '/user/dashboard?section=abstracts'}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium text-xs sm:text-sm">Submit Abstract</span>
                </Button>
              </div>

              {/* Sponsors Section */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">Silver Sponsor</h3>
                <div className="flex items-center gap-6">
                  <div className="text-primary font-semibold">tietoevry</div>
                  <div className="flex items-center gap-2 text-primary">
                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                    <span className="font-medium">vernost</span>
                  </div>
                  <div className="w-8 h-8 bg-primary/20 rounded-full"></div>
                </div>
              </div>

              {/* Event Details Section */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">Event Details</h2>
                
                {/* Event Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-3">About This Event</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Date & Time */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Date & Time
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-foreground font-medium mb-2">
                      {selectedEvent.date}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Registered on {selectedEvent.registrationDate}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Location
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-foreground font-medium mb-1">{selectedEvent.venue}</p>
                    <p className="text-muted-foreground">{selectedEvent.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view - My Events Overview
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          
          {/* Left Sidebar - User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-lg p-6 sticky top-24 border border-border">
              <div className="text-right mb-4">
                <Button variant="outline" size="sm" className="text-xs">
                  Edit
                </Button>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <span className="text-2xl font-bold text-primary">{user.initials}</span>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-card"></div>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-1">{user.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">Software Engineer</p>
                <p className="text-sm text-muted-foreground">Dukapaq Ltd.</p>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{userEvents.length}</p>
                    <p className="text-xs text-muted-foreground">Events</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {userEvents.filter(e => e.status === 'completed').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - My Events */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">My Events</h1>
              <p className="text-muted-foreground">
                Manage and explore all your registered events
              </p>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading your events...</p>
              </div>
            ) : userEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={event.image}
                      alt={event.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className={`${getStatusColor(event.status || 'upcoming')} border-0`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(event.status || 'upcoming')}
                          <span className="capitalize">{event.status || 'upcoming'}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{event.type}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Registered: {new Date(event.registrationDate).toLocaleDateString()}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Events Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't registered for any events yet. Start exploring!
                </p>
                <Button>
                  Browse Events
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
