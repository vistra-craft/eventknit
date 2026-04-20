import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventPreviewModal } from '@/components/events/EventPreviewModal';
import { getEventById, type EventData } from "@/lib/event-api";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage, showErrorToast } from "@/lib/utils/error";

const EventPreviewPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await getEventById(eventId);
        if (response.success && response.data?.event) {
          setEvent(response.data.event);
        } else {
          setError("Failed to load event details");
          showErrorToast(toast, new Error("Failed to load event details"), "Load failed", "Failed to load event details");
        }
      } catch (error: unknown) {
        setError(extractErrorMessage(error, "Failed to load event details"));
        showErrorToast(toast, error, "Load failed", "Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, toast]);

  const handleModalOpenChange = (open: boolean) => {
    setShowModal(open);
    if (!open) {
      // Go back when modal closes
      navigate(-1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Event Preview
          </h1>
          <p className="text-muted-foreground mt-1">
            View complete event details
          </p>
        </div>
        {eventId && (
          <Button variant="default" asChild>
            <Link to={`/event/${event?.slug ?? eventId}`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              View Public Page
            </Link>
          </Button>
        )}
      </div>

      {/* Event Preview Modal */}
      <EventPreviewModal
        isOpen={showModal}
        onOpenChange={handleModalOpenChange}
        event={event}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default EventPreviewPage;



