import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { 
  Calendar, 
  Users, 
  QrCode, 
  Eye,
  CheckCircle,
  Clock,
  MapPin,
  Building2,
  ArrowRight,
  Activity
} from "lucide-react";
import AdminLayout from "../AdminLayout";
import { getEvents, type EventData } from "../../../lib/event-api";
import { getEvent, type EventStatistics } from "../../../lib/workstation-api";
import { useToast } from "../../../hooks/use-toast";

interface EventWithStats extends EventData {
  statistics?: EventStatistics;
}

const WorkstationOverview: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    totalScanned: 0,
    totalRevenue: 0,
  });

  // Load events with statistics
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const response = await getEvents({ limit: 100 });
        if (response.success && response.data) {
          const eventsWithStats: EventWithStats[] = [];
          
          // Load statistics for each event
          for (const event of response.data.events) {
            try {
              const eventResponse = await getEvent(event.id);
              if (eventResponse.success && eventResponse.data) {
                eventsWithStats.push({
                  ...event,
                  statistics: eventResponse.data.statistics,
                });
              } else {
                eventsWithStats.push(event);
              }
            } catch (error) {
              console.error(`Error loading statistics for event ${event.id}:`, error);
              eventsWithStats.push(event);
            }
          }
          
          setEvents(eventsWithStats);
          
          // Calculate totals
          const totalEvents = eventsWithStats.length;
          const totalAttendees = eventsWithStats.reduce((sum, event) => 
            sum + (event.statistics?.totalAttendees || 0), 0
          );
          const totalScanned = eventsWithStats.reduce((sum, event) => 
            sum + (event.statistics?.checkedIn || 0), 0
          );
          
          setStats({
            totalEvents,
            totalAttendees,
            totalScanned,
            totalRevenue: 0, // Revenue not available from workstation API
          });
        }
      } catch (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [toast]);

  // Determine event status
  const getEventStatus = (event: EventWithStats): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    
    if (endDate && now > endDate) {
      return 'completed';
    } else if (now >= startDate && (!endDate || now <= endDate)) {
      return 'ongoing';
    } else {
      return 'upcoming';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'ongoing':
        return "bg-green-100 text-green-800 border-green-200";
      case 'completed':
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-3 h-3" />;
      case 'ongoing':
        return <Activity className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time range
  const formatTimeRange = (event: EventWithStats) => {
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    
    if (endDate && startDate.toDateString() !== endDate.toDateString()) {
      return `${formatDate(event.startDate)} - ${event.endDate ? formatDate(event.endDate) : 'Ongoing'}`;
    } else {
      return formatDate(event.startDate);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workstation Management</h1>
            <p className="text-gray-600 mt-2">Select an event to manage attendees, facilities, and operations</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading events...</div>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                    <p className="text-2xl font-bold">{stats.totalEvents}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                    <p className="text-2xl font-bold">{stats.totalAttendees.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tickets Scanned</p>
                    <p className="text-2xl font-bold">{stats.totalScanned.toLocaleString()}</p>
                  </div>
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Currently Inside</p>
                    <p className="text-2xl font-bold">
                      {events.reduce((sum, event) => 
                        sum + (event.statistics?.currentlyInside || 0), 0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Events Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Events</h2>
            <Button 
              onClick={() => navigate('/admin/workstation/events')}
              variant="outline"
            >
              Detailed View
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const status = getEventStatus(event);
                const imageUrl = event.image || event.images?.[0] || '/placeholder-event.jpg';
                const organizerName = event.organizer?.organizationName || event.organizer?.firstName || 'Unknown';
                
                return (
                  <Card 
                    key={event.id} 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    onClick={() => navigate(`/admin/workstation/event/${event.id}`)}
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={imageUrl}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-event.jpg';
                        }}
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getStatusColor(status)} border-0`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(status)}
                            <span className="capitalize">{status}</span>
                          </div>
                        </Badge>
                      </div>
                      {event.category && (
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="bg-white/90 text-gray-800">
                            {event.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{organizerName}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatTimeRange(event)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building2 className="w-4 h-4" />
                              <span>{event.venue}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Total</p>
                              <p className="font-semibold">{event.statistics?.totalAttendees || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Checked In</p>
                              <p className="font-semibold">{event.statistics?.checkedIn || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Inside</p>
                              <p className="font-semibold text-green-600">{event.statistics?.currentlyInside || 0}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!loading && events.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-600">No events found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default WorkstationOverview;
