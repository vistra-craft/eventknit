import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  Download,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { EventThumbnail } from "../../components/ui/event-thumbnail";
import DashboardSpeakers from "./DashboardSpeakers";
import DashboardExhibitors from "./DashboardExhibitors";
import DashboardSponsors from "./DashboardSponsors";
import DashboardAgenda from "./DashboardAgenda";
import DashboardMyBadge from "./DashboardMyBadge";
// TODO: Uncomment when abstracts backend is implemented
// import DashboardAbstracts from "./DashboardAbstracts";
import DashboardAttendees from "./DashboardAttendees";
import { shareEvent } from "../../lib/utils/share";
import { downloadTicket } from "../../lib/utils/ticket";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";

interface EventDetailViewProps {
  eventData?: {
    id: string;
    title: string;
    date: string;
    location: string;
    type: string;
    image: string;
    venue?: string;
    description?: string;
    status?: 'upcoming' | 'ongoing' | 'completed';
    category?: string;
    registrationDate?: string;
  };
  registration?: {
    ticketId?: string;
    status?: string;
  };
}

const EventDetailView: React.FC<EventDetailViewProps> = ({ eventData: propEventData, registration: propRegistration }) => {
  useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // In a real implementation, you would fetch event data if not provided
  // For now, we'll use the prop data or show a loading/error state
  const eventData = propEventData;
  const registration = propRegistration;

  const user = authUser ? {
    name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email || 'User',
    email: authUser.email || '',
    initials: authUser.firstName && authUser.lastName 
      ? `${authUser.firstName[0]}${authUser.lastName[0]}`.toUpperCase()
      : (authUser.email ? authUser.email[0].toUpperCase() : 'U'),
  } : {
    name: 'User',
    email: '',
    initials: 'U',
  };

  if (!eventData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't find the event you're looking for.
          </p>
          <Button onClick={() => navigate('/user/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const handleShare = async () => {
    const shared = await shareEvent(eventData.title, eventData.id);
    if (shared) {
      toast({
        title: "Shared",
        description: "Event shared successfully",
      });
    } else {
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard",
      });
    }
  };

  const handleDownloadTicket = () => {
    try {
      downloadTicket({
        eventTitle: eventData.title,
        eventDate: eventData.date,
        eventLocation: eventData.location,
        attendeeName: user.name,
        attendeeEmail: user.email,
        ticketType: eventData.type || 'Standard',
        ticketId: registration?.ticketId || `${eventData.id}-${Date.now()}`,
      });
      toast({
        title: "Downloaded",
        description: "Ticket downloaded successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to download ticket",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to="/user/dashboard?section=my-events" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to My Events
          </Link>
        </div>

        {/* Event Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="relative h-64">
            <EventThumbnail
              src={eventData.image}
              alt={eventData.title}
              category={eventData.category || ''}
              size="lg"
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{eventData.title}</h1>
                  <Badge className={`${getStatusColor(eventData.status || 'upcoming')} border-0`}>
                    {(eventData.status || 'upcoming').charAt(0).toUpperCase() + (eventData.status || 'upcoming').slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">{eventData.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm">{eventData.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">{eventData.type}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-border bg-card">
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownloadTicket} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Download Ticket
              </Button>
              <Button variant="outline" onClick={handleShare} className="flex-1 sm:flex-none">
                <Share2 className="h-4 w-4 mr-2" />
                Share Event
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open(`/event/${eventData.id}`, '_blank')}
                className="flex-1 sm:flex-none"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Page
              </Button>
            </div>
          </div>
        </Card>

        {/* Event Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="speakers">Speakers</TabsTrigger>
            <TabsTrigger value="exhibitors">Exhibitors</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="badge">My Badge</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Event Overview</h2>
              {eventData.description && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{eventData.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Event Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Date & Time</dt>
                      <dd className="text-sm font-medium">{eventData.date}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Location</dt>
                      <dd className="text-sm font-medium">{eventData.venue || eventData.location}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Event Type</dt>
                      <dd className="text-sm font-medium">{eventData.type}</dd>
                    </div>
                    {eventData.category && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Category</dt>
                        <dd className="text-sm font-medium">{eventData.category}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {eventData.registrationDate && (
                  <div>
                    <h3 className="font-medium mb-2">Registration Details</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-muted-foreground">Registered On</dt>
                        <dd className="text-sm font-medium">
                          {new Date(eventData.registrationDate).toLocaleDateString()}
                        </dd>
                      </div>
                      {registration?.ticketId && (
                        <div>
                          <dt className="text-sm text-muted-foreground">Ticket ID</dt>
                          <dd className="text-sm font-medium font-mono">{registration.ticketId}</dd>
                        </div>
                      )}
                      {registration?.status && (
                        <div>
                          <dt className="text-sm text-muted-foreground">Status</dt>
                          <dd className="text-sm font-medium">
                            <Badge variant="outline">{registration.status}</Badge>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>

              {/* TODO: Uncomment when abstracts backend is implemented */}
              {/* Quick Submit Abstract Button */}
              {/* <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("abstracts")}
                  className="w-full sm:w-auto"
                >
                  Submit an Abstract
                </Button>
              </div> */}
            </Card>
          </TabsContent>

          <TabsContent value="agenda" className="mt-0">
            <DashboardAgenda eventData={eventData} user={user} />
          </TabsContent>

          <TabsContent value="speakers" className="mt-0">
            <DashboardSpeakers eventData={eventData} />
          </TabsContent>

          <TabsContent value="exhibitors" className="mt-0">
            <DashboardExhibitors eventData={eventData} />
          </TabsContent>

          <TabsContent value="sponsors" className="mt-0">
            <DashboardSponsors eventData={eventData} />
          </TabsContent>

          <TabsContent value="attendees" className="mt-0">
            <DashboardAttendees />
          </TabsContent>

          <TabsContent value="badge" className="mt-0">
            <DashboardMyBadge eventData={eventData} user={user} registration={registration} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EventDetailView;
