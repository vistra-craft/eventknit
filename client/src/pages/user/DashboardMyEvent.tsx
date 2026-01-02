import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { EventAttendeeView } from "../../components/event-attendee";
import type { EventData, User } from "../../components/event-attendee";
import { getEventById, getUserRegisteredEvents } from "../../lib/event-api";
import { useAuth } from "../../hooks/useAuth";

const DashboardMyEvent: React.FC = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform auth user to the User type expected by EventAttendeeView
  const fullName = authUser ? `${authUser.firstName} ${authUser.lastName}`.trim() : 'User';
  const initials = authUser
    ? `${authUser.firstName?.[0] || ''}${authUser.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  const user: User = {
    name: fullName,
    email: authUser?.email || '',
    initials: initials,
    profileImage: authUser?.avatar || undefined,
    company: authUser?.companyAffiliation || authUser?.organizationName || undefined,
    title: undefined,
  };

  // Transform API event data to the EventData type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformEventData = (apiEvent: any, registrationDate?: string): EventData => {
    return {
      id: String(apiEvent.id || ''),
      title: String(apiEvent.title || ''),
      description: apiEvent.description as string | undefined,
      fullDescription: apiEvent.fullDescription as string | undefined,
      date: String(apiEvent.date || apiEvent.startDate || ''),
      endDate: apiEvent.endDate as string | undefined,
      time: apiEvent.time as string | undefined,
      location: String(apiEvent.location || ''),
      venue: apiEvent.venue as string | undefined,
      type: String(apiEvent.type || apiEvent.eventType || 'Event'),
      image: apiEvent.image as string | undefined,
      category: apiEvent.category as string | undefined,
      status: apiEvent.status as 'upcoming' | 'ongoing' | 'completed' | undefined,
      registrationDate: registrationDate,
      organizer: apiEvent.organizer as string | undefined,
      organizerDescription: apiEvent.organizerDescription as string | undefined,
      speakers: Array.isArray(apiEvent.speakers) ? apiEvent.speakers.map((s: Record<string, unknown>) => ({
        id: s.id as string | undefined,
        name: String(s.name || ''),
        title: String(s.title || ''),
        bio: s.bio as string | undefined,
        image: s.image as string | undefined,
        company: s.company as string | undefined,
      })) : undefined,
      sponsors: Array.isArray(apiEvent.sponsors) ? apiEvent.sponsors.map((s: Record<string, unknown>) => ({
        id: s.id as string | undefined,
        name: String(s.name || ''),
        level: (s.level || 'associate') as 'platinum' | 'gold' | 'silver' | 'bronze' | 'title' | 'presenting' | 'community' | 'associate',
        logo: s.logo as string | undefined,
        website: s.website as string | undefined,
        description: s.description as string | undefined,
      })) : undefined,
      exhibitors: Array.isArray(apiEvent.exhibitors) ? apiEvent.exhibitors.map((e: Record<string, unknown>) => ({
        id: e.id as string | undefined,
        name: String(e.name || ''),
        description: e.description as string | undefined,
        logo: e.logo as string | undefined,
        contactEmail: e.contactEmail as string | undefined,
        booth: e.booth as string | undefined,
        category: e.category as string | undefined,
        website: e.website as string | undefined,
      })) : undefined,
      agenda: Array.isArray(apiEvent.agenda) ? apiEvent.agenda.map((a: Record<string, unknown>) => ({
        id: a.id as string | undefined,
        title: String(a.title || ''),
        description: a.description as string | undefined,
        date: a.date as string | undefined,
        startTime: String(a.startTime || ''),
        endTime: String(a.endTime || ''),
        location: a.location as string | undefined,
        type: a.type as 'keynote' | 'panel' | 'workshop' | 'networking' | 'break' | 'session' | undefined,
        speakers: Array.isArray(a.speakers) ? a.speakers.map(String) : undefined,
      })) : undefined,
      socialLinks: apiEvent.socialLinks as Record<string, string> | undefined,
      hashtag: apiEvent.hashtag as string | undefined,
    };
  };

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        // If no eventId, fetch user's events and use the first one
        try {
          setLoading(true);
          const response = await getUserRegisteredEvents();
          if (response.success && response.data?.events && response.data.events.length > 0) {
            const event = response.data.events[0];
            // Fetch full event details
            const fullEventResponse = await getEventById(event.id);
            if (fullEventResponse.success && fullEventResponse.data?.event) {
              setEventData(transformEventData(fullEventResponse.data.event, event.registrationDate));
            } else {
              setError('Could not load event details');
            }
          } else {
            setError('No registered events found');
          }
        } catch {
          setError('Failed to load events');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Fetch specific event by ID
      try {
        setLoading(true);

        // Get registration info
        const registeredResponse = await getUserRegisteredEvents();
        const registrationInfo = registeredResponse.data?.events?.find(
          (e: { id: string }) => e.id === eventId
        );

        // Get full event details
        const eventResponse = await getEventById(eventId);
        if (eventResponse.success && eventResponse.data?.event) {
          setEventData(transformEventData(
            eventResponse.data.event,
            registrationInfo?.registrationDate
          ));
        } else {
          setError('Event not found');
        }
      } catch {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Event not found'}</AlertDescription>
          </Alert>
          <div className="text-center mt-6">
            <Button onClick={() => navigate('/user/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <EventAttendeeView event={eventData} user={user} />;
};

export default DashboardMyEvent;
