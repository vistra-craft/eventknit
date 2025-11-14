import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventThumbnail } from "@/components/ui/event-thumbnail";
import AdminLayout from "../AdminLayout";
import { getEventById, type EventData } from "@/lib/event-api";
import { useToast } from "@/hooks/use-toast";

const EventPreviewPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        const response = await getEventById(eventId);
        if (response.success && response.data?.event) {
          setEvent(response.data.event);
        } else {
          toast({
            title: "Error",
            description: "Failed to load event details",
            variant: "destructive",
          });
          navigate("/admin/events");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load event details",
          variant: "destructive",
        });
        navigate("/admin/events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, navigate, toast]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Event not found</p>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/events")}
            className="mt-4"
          >
            Back to Events
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Event Preview</h1>
            <p className="text-sm text-gray-600">View event details</p>
          </div>
          <Button
            variant="default"
            onClick={() => window.open(`/event/${eventId}`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Public Page
          </Button>
        </div>

        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <EventThumbnail
                  src={event.image}
                  alt={event.title}
                  category={event.category || ''}
                  size="lg"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h2>
                  {event.category && (
                    <Badge className="mb-2">{event.category}</Badge>
                  )}
                  {event.status && (
                    <Badge className="ml-2 mb-2">{event.status}</Badge>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-3">{event.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.startDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">
                        {new Date(event.startDate).toLocaleDateString()}
                        {event.startTime && ` at ${event.startTime}`}
                      </p>
                    </div>
                  </div>
                )}
                {event.endDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">
                        {new Date(event.endDate).toLocaleDateString()}
                        {event.endTime && ` at ${event.endTime}`}
                      </p>
                    </div>
                  </div>
                )}
                {(event.location || event.venue) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{event.location || event.venue}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Attendees</p>
                    <p className="font-medium">{event.attendees || 0}</p>
                  </div>
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-medium">{event.capacity}</p>
                    </div>
                  </div>
                )}
                {event.price !== undefined && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium">
                        {event.isFree ? "Free" : `$${event.price}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EventPreviewPage;

