import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, Ticket, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
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

interface Registration {
  ticketId?: string;
  status?: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
}

interface DashboardMyEventProps {
  eventData?: EventData;
  registration?: Registration;
  user: User;
}

const DashboardMyEvent: React.FC<DashboardMyEventProps> = ({ eventData: propEventData }) => {
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const [eventData, setEventData] = useState<EventData | null>(propEventData || null);
  const [loading, setLoading] = useState(!propEventData);
  const [error, setError] = useState<string | null>(null);

  // If eventId is in URL, fetch that specific event
  useEffect(() => {
    const fetchEvent = async () => {
      if (propEventData) {
        setEventData(propEventData);
        return;
      }

      if (!eventId) {
        // If no eventId and no propEventData, fetch all events and use the first one
        try {
          setLoading(true);
          const response = await getUserRegisteredEvents();
          if (response.success && response.data?.events && response.data.events.length > 0) {
            setEventData(response.data.events[0]);
          } else {
            setError('No events found');
          }
        } catch {
          setError('Failed to load event');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Fetch specific event by ID
      try {
        setLoading(true);
        const response = await getUserRegisteredEvents();
        if (response.success && response.data?.events) {
          const event = response.data.events.find(e => e.id === eventId);
          if (event) {
            setEventData(event);
          } else {
            setError('Event not found');
          }
        }
      } catch {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, propEventData]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Event not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/user/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/user/dashboard')}>
          ← Back to Events
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Header */}
          <Card>
            <div className="relative h-64 overflow-hidden rounded-t-lg">
              <img 
                src={eventData.image} 
                alt={eventData.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-3xl font-bold text-white mb-2">{eventData.title}</h1>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(eventData.status)}>
                    {eventData.status || 'upcoming'}
                  </Badge>
                  {eventData.category && (
                    <Badge variant="secondary">{eventData.category}</Badge>
                  )}
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-5 h-5" />
                  <span>{eventData.date}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  <span>{eventData.venue || eventData.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" />
                  <span>{eventData.type}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Description */}
          {eventData.description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{eventData.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Registration Details */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Registration Date</span>
                  <span className="font-medium">
                    {new Date(eventData.registrationDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(eventData.status)}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {eventData.status || 'upcoming'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Ticket className="w-4 h-4 mr-2" />
                View Ticket
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                View Attendees
              </Button>
            </CardContent>
          </Card>

          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Event Type</p>
                <p className="font-medium">{eventData.type}</p>
              </div>
              {eventData.category && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-medium">{eventData.category}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="font-medium">{eventData.location}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardMyEvent;

