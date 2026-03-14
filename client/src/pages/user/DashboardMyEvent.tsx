import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { EventAttendeeView } from "../../components/event-attendee";
import type { EventData, User, Speaker, SeatInfo } from "../../components/event-attendee";
import { getEventById, getUserRegisteredEvents } from "../../lib/event-api";
import { getTicket } from "../../lib/ticket-api";
import { useAuth } from "../../hooks/useAuth";

interface RegistrationInfo {
  id: string;
  registrationDate?: string;
  registrationId?: string;
  ticketType?: string;
  backupCode?: string;
}

interface ApiSpeaker {
  id?: unknown;
  name?: unknown;
  title?: unknown;
  bio?: unknown;
  image?: unknown;
  company?: unknown;
}

interface ApiAgendaItem {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  location?: unknown;
  room?: unknown;
  type?: unknown;
  sessionType?: unknown;
  speakers?: unknown;
  speakerIds?: unknown;
  speakerDetails?: unknown;
}

interface ApiSponsor {
  id?: unknown;
  name?: unknown;
  level?: unknown;
  logo?: unknown;
  website?: unknown;
  description?: unknown;
}

interface ApiExhibitor {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  logo?: unknown;
  contactEmail?: unknown;
  booth?: unknown;
  category?: unknown;
  website?: unknown;
}

interface ApiEvent {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  fullDescription?: unknown;
  date?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  time?: unknown;
  startTime?: unknown;
  endTime?: unknown;  location?: unknown;
  venue?: unknown;
  type?: unknown;
  eventType?: unknown;
  image?: unknown;
  category?: unknown;
  status?: unknown;
  organizer?: unknown;
  organizerId?: unknown;
  organizerDescription?: unknown;
  speakers?: unknown;
  sponsors?: unknown;
  exhibitors?: unknown;
  agenda?: unknown;
  socialLinks?: unknown;
  hashtag?: unknown;
  address?: unknown;
  coordinates?: unknown;
  isOnline?: unknown;
  onlineLink?: unknown;
}

const VALID_SPONSOR_LEVELS = new Set([
  'platinum', 'gold', 'silver', 'bronze', 'title', 'presenting', 'community', 'associate',
]);

const VALID_STATUSES = new Set(['upcoming', 'ongoing', 'completed']);

function toSponsorLevel(raw: unknown): 'platinum' | 'gold' | 'silver' | 'bronze' | 'title' | 'presenting' | 'community' | 'associate' {
  return VALID_SPONSOR_LEVELS.has(String(raw))
    ? String(raw) as 'platinum' | 'gold' | 'silver' | 'bronze' | 'title' | 'presenting' | 'community' | 'associate'
    : 'associate';
}

function toEventStatus(raw: unknown): 'upcoming' | 'ongoing' | 'completed' | undefined {
  return VALID_STATUSES.has(String(raw))
    ? String(raw) as 'upcoming' | 'ongoing' | 'completed'
    : undefined;
}

function toSpeaker(s: ApiSpeaker): Speaker {
  return {
    id: typeof s.id === 'string' ? s.id : undefined,
    name: String(s.name ?? ''),
    title: String(s.title ?? ''),
    bio: typeof s.bio === 'string' ? s.bio : undefined,
    image: typeof s.image === 'string' ? s.image : undefined,
    company: typeof s.company === 'string' ? s.company : undefined,
  };
}

// Transform raw API event data into the EventData type expected by EventAttendeeView
const transformEventData = (
  apiEvent: ApiEvent,
  registrationInfo?: {
    registrationDate?: string;
    registrationId?: string;
    ticketType?: string;
    backupCode?: string;
  },
  seat?: SeatInfo,
): EventData => {
  const speakers: Speaker[] = Array.isArray(apiEvent.speakers)
    ? (apiEvent.speakers as ApiSpeaker[]).map(toSpeaker)
    : [];

  const sponsors = Array.isArray(apiEvent.sponsors)
    ? (apiEvent.sponsors as ApiSponsor[]).map(s => ({
        id: typeof s.id === 'string' ? s.id : undefined,
        name: String(s.name ?? ''),
        level: toSponsorLevel(s.level),
        logo: typeof s.logo === 'string' ? s.logo : undefined,
        website: typeof s.website === 'string' ? s.website : undefined,
        description: typeof s.description === 'string' ? s.description : undefined,
      }))
    : undefined;

  const exhibitors = Array.isArray(apiEvent.exhibitors)
    ? (apiEvent.exhibitors as ApiExhibitor[]).map(e => ({
        id: typeof e.id === 'string' ? e.id : undefined,
        name: String(e.name ?? ''),
        description: typeof e.description === 'string' ? e.description : undefined,
        logo: typeof e.logo === 'string' ? e.logo : undefined,
        contactEmail: typeof e.contactEmail === 'string' ? e.contactEmail : undefined,
        booth: typeof e.booth === 'string' ? e.booth : undefined,
        category: typeof e.category === 'string' ? e.category : undefined,
        website: typeof e.website === 'string' ? e.website : undefined,
      }))
    : undefined;

  const agenda = Array.isArray(apiEvent.agenda)
    ? (apiEvent.agenda as ApiAgendaItem[]).map(a => ({
        id: typeof a.id === 'string' ? a.id : undefined,
        title: String(a.title ?? ''),
        description: typeof a.description === 'string' ? a.description : undefined,
        date: typeof a.date === 'string' ? a.date : undefined,
        startTime: String(a.startTime ?? ''),
        endTime: String(a.endTime ?? ''),
        location: typeof a.location === 'string' ? a.location : undefined,
        room: typeof a.room === 'string' ? a.room : undefined,
        type: typeof a.type === 'string' ? a.type : undefined,
        sessionType: typeof a.sessionType === 'string' ? a.sessionType : undefined,
        speakers: Array.isArray(a.speakers)
          ? (a.speakers as unknown[]).map(String)
          : undefined,
        speakerIds: Array.isArray(a.speakerIds)
          ? (a.speakerIds as unknown[]).map(String)
          : undefined,
        speakerDetails: Array.isArray(a.speakerDetails)
          ? (a.speakerDetails as ApiSpeaker[]).map(toSpeaker)
          : undefined,
      }))
    : undefined;

  return {
    id: String(apiEvent.id ?? ''),
    title: String(apiEvent.title ?? ''),
    description: typeof apiEvent.description === 'string' ? apiEvent.description : undefined,
    fullDescription: typeof apiEvent.fullDescription === 'string' ? apiEvent.fullDescription : undefined,
    date: typeof apiEvent.startDate === 'string' ? apiEvent.startDate : String(apiEvent.date ?? ''),
    endDate: typeof apiEvent.endDate === 'string' ? apiEvent.endDate : undefined,
    time: apiEvent.startTime && typeof apiEvent.startTime === 'string'
      ? (typeof apiEvent.endTime === 'string' ? `${apiEvent.startTime} - ${apiEvent.endTime}` : apiEvent.startTime)
      : (typeof apiEvent.time === 'string' ? apiEvent.time : undefined),
    location: String(apiEvent.location ?? ''),
    venue: typeof apiEvent.venue === 'string' ? apiEvent.venue : undefined,
    type: String(apiEvent.type ?? apiEvent.eventType ?? 'Event'),
    image: typeof apiEvent.image === 'string' ? apiEvent.image : undefined,
    category: typeof apiEvent.category === 'string' ? apiEvent.category : undefined,
    status: toEventStatus(apiEvent.status),
    registrationDate: registrationInfo?.registrationDate,
    organizer: typeof apiEvent.organizer === 'string' ? apiEvent.organizer : undefined,
    organizerId: typeof apiEvent.organizerId === 'string' ? apiEvent.organizerId : undefined,
    organizerDescription: typeof apiEvent.organizerDescription === 'string' ? apiEvent.organizerDescription : undefined,
    speakers: speakers.length > 0 ? speakers : undefined,
    sponsors,
    exhibitors,
    agenda,
    socialLinks: apiEvent.socialLinks != null && typeof apiEvent.socialLinks === 'object'
      ? apiEvent.socialLinks as Record<string, string>
      : undefined,
    hashtag: typeof apiEvent.hashtag === 'string' ? apiEvent.hashtag : undefined,
    // Location extras
    address: typeof apiEvent.address === 'string' ? apiEvent.address : undefined,
    coordinates: apiEvent.coordinates != null && typeof apiEvent.coordinates === 'object'
      && 'lat' in (apiEvent.coordinates as object) && 'lng' in (apiEvent.coordinates as object)
      ? apiEvent.coordinates as { lat: number; lng: number }
      : undefined,
    isOnline: typeof apiEvent.isOnline === 'boolean' ? apiEvent.isOnline : undefined,
    onlineLink: typeof apiEvent.onlineLink === 'string' ? apiEvent.onlineLink : undefined,
    // Registration & ticket data
    registrationId: registrationInfo?.registrationId,
    ticketType: registrationInfo?.ticketType,
    backupCode: registrationInfo?.backupCode,
    // Seat allocation from ticket endpoint
    seat,
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardMyEvent: React.FC = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fullName = authUser ? `${authUser.firstName ?? ''} ${authUser.lastName ?? ''}`.trim() : 'User';
  const initials = authUser
    ? `${authUser.firstName?.[0] ?? ''}${authUser.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';

  const user: User = {
    name: fullName,
    email: authUser?.email ?? '',
    initials,
    profileImage: authUser?.avatar ?? undefined,
    company: authUser?.companyAffiliation ?? authUser?.organizationName ?? undefined,
    title: undefined,
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);

        // Always load the user's registrations so we can cross-reference registration info
        const registeredResponse = await getUserRegisteredEvents();
        const registrations: RegistrationInfo[] = registeredResponse.data?.events ?? [];

        let targetEventId = eventId;

        if (!targetEventId) {
          // No event ID in URL — use the first registered event
          if (registrations.length === 0) {
            setError('No registered events found');
            return;
          }
          targetEventId = registrations[0].id;
        }

        const registrationInfo = registrations.find(e => e.id === targetEventId);

        // Fetch full event details in parallel with ticket data (if we have a registrationId)
        const [eventResponse, ticketResponse] = await Promise.all([
          getEventById(targetEventId),
          registrationInfo?.registrationId
            ? getTicket(registrationInfo.registrationId).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (!eventResponse.success || !eventResponse.data?.event) {
          setError('Event not found');
          return;
        }

        const seat: SeatInfo | undefined = ticketResponse?.success && ticketResponse.data?.seat
          ? ticketResponse.data.seat
          : undefined;

        setEventData(
          transformEventData(
            eventResponse.data.event as ApiEvent,
            registrationInfo
              ? {
                  registrationDate: registrationInfo.registrationDate,
                  registrationId: registrationInfo.registrationId,
                  ticketType: registrationInfo.ticketType,
                  backupCode: registrationInfo.backupCode,
                }
              : undefined,
            seat,
          ),
        );
      } catch {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    void fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader size="2xl" className="text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event…</p>
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
            <AlertDescription>{error ?? 'Event not found'}</AlertDescription>
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
