import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Ticket,
  Download,
  Calendar,
  Share2,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import CheckoutHeader from "@/components/CheckoutHeader";
import { useAuth } from "@/hooks/useAuth";
import { getEventById } from "@/lib/event-api";
import type { EventData } from "@/types/event";
import { shareEvent } from "@/lib/utils/share";
import { useToast } from "@/hooks/useToast";
import { downloadTicketPDF, resendTicketEmail } from "@/lib/ticket-api";

interface TicketType {
  name: string;
  quantity: number;
  price: number;
}

interface ConfirmationData {
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  organizerName?: string;
  registrationId: string;
  tickets: TicketType[];
  totalPrice?: number;
  paymentMethod?: string;
  paymentId?: string;
  date: string;
  isGuestUser?: boolean;
  userEmail?: string;
  isFreeEvent?: boolean;
  isNewUser?: boolean;
  discount?: number;
  promoCode?: string;
}

type EventApiData = EventData;

const RegistrationConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [eventData, setEventData] = useState<EventApiData | ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const confirmationData = location.state as ConfirmationData | null;

  // Fetch event data if not provided
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        setLoading(true);
        const response = await getEventById(eventId);
        if (response.success && response.data?.event) {
          setEventData(response.data.event);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!confirmationData && eventId) {
      fetchEvent();
    } else if (confirmationData) {
      setEventData(confirmationData);
      setLoading(false);
    }
  }, [eventId, confirmationData]);

  const isGuestUser = confirmationData?.isGuestUser ?? false;
  const isNewUser = confirmationData?.isNewUser ?? false;
  const userEmail = confirmationData?.userEmail || user?.email || "";
  const event = eventData || confirmationData;

  // Helper functions
  const getStartDate = (): string | undefined => {
    if (!event) return undefined;
    if ("startDate" in event && typeof event.startDate === "string") return event.startDate;
    if ("eventDate" in event && typeof event.eventDate === "string") return event.eventDate;
    return undefined;
  };

  const getStartTime = (): string | undefined => {
    if (!event) return undefined;
    if ("startTime" in event && typeof event.startTime === "string") return event.startTime;
    if ("eventTime" in event && typeof event.eventTime === "string") return event.eventTime;
    return undefined;
  };

  const getVenue = (): string => {
    if (!event) return "";
    if ("venue" in event && typeof event.venue === "string") return event.venue || "";
    return "";
  };

  const getLocation = (): string => {
    if (!event) return "";
    const venue = getVenue();
    const location = (() => {
      if ("location" in event && typeof event.location === "string") return event.location || "";
      if ("eventLocation" in event && typeof event.eventLocation === "string") return event.eventLocation || "";
      return "";
    })();
    return venue ? `${venue}, ${location}` : location;
  };

  const getTitle = (): string => {
    if (!event) return "";
    if ("title" in event && typeof event.title === "string") return event.title || "";
    if ("eventTitle" in event && typeof event.eventTitle === "string") return event.eventTitle || "";
    return "";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Handlers
  const handleDownloadTicket = async () => {
    if (!confirmationData?.registrationId) return;
    setIsDownloading(true);
    try {
      await downloadTicketPDF(confirmationData.registrationId);
      toast({ title: "Downloaded!", description: "Your ticket has been downloaded." });
    } catch {
      toast({ title: "Download failed", description: "We couldn't download your ticket. Please try again or check your email for a copy.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!confirmationData?.registrationId || !isAuthenticated) return;
    setIsResending(true);
    try {
      await resendTicketEmail(confirmationData.registrationId);
      toast({ title: "Email sent!", description: "Your ticket email has been resent." });
    } catch {
      toast({ title: "Couldn't resend email", description: "Please try again in a moment. Your ticket is still valid.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  const handleAddToCalendar = () => {
    const startDate = getStartDate();
    const startTime = getStartTime() || "10:00";
    if (!startDate) return;

    const d = new Date(startDate);
    const [hours, minutes] = startTime.split(":");
    d.setHours(parseInt(hours), parseInt(minutes));
    const start = d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endD = new Date(d.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    const end = endD.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      getTitle()
    )}&dates=${start}/${end}&location=${encodeURIComponent(getLocation())}`;
    window.open(url, "_blank");
  };

  const handleShareEvent = () => {
    shareEvent(getTitle(), eventId || confirmationData?.eventId || "");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!confirmationData && !eventData) {
    return (
      <div className="min-h-screen bg-background">
        <CheckoutHeader />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Confirmation data not found.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const isFree = confirmationData?.isFreeEvent ?? (event && "isFree" in event ? event.isFree : false);
  const ticketSummary = confirmationData?.tickets?.filter(t => t.quantity > 0) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <CheckoutHeader backLink="/" backLabel="Back to Events" />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success dark:text-success" />
          </div>
          <h1 className="text-2xl font-bold">You're Registered!</h1>
          <p className="text-muted-foreground">
            Your spot for <span className="font-medium text-foreground">{getTitle()}</span> is confirmed.
          </p>
          {confirmationData?.registrationId && (
            <p className="text-xs text-muted-foreground font-mono">
              ID: {confirmationData.registrationId.slice(0, 8)}...
            </p>
          )}
        </div>

        {/* Email Notice */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your ticket and QR code are on their way to{" "}
                <span className="font-medium">{userEmail}</span>.
                {isGuestUser && isNewUser && (
                  <> The email also includes a link to set up your account.</>
                )}
              </p>
            </div>
            {confirmationData?.registrationId && isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendEmail}
                disabled={isResending}
                className="text-xs shrink-0"
              >
                {isResending ? "Sending..." : "Resend"}
              </Button>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Registration Details
          </h3>

          <div className="space-y-3 text-sm">
            <div className="font-medium">{getTitle()}</div>

            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(getStartDate())}</span>
              </div>
              {getStartTime() && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(getStartTime())}</span>
                </div>
              )}
            </div>

            {getLocation() && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{getLocation()}</span>
              </div>
            )}
          </div>

          {/* Tickets */}
          {ticketSummary.length > 0 && (
            <div className="pt-3 border-t space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tickets</p>
              {ticketSummary.map((ticket, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{ticket.quantity}x {ticket.name}</span>
                  {!isFree && <span className="font-medium">KES {(ticket.price * ticket.quantity).toLocaleString()}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCalendar}
            className="flex-col h-auto py-3 gap-1"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px]">Add to Calendar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTicket}
            disabled={isDownloading || !confirmationData?.registrationId}
            className="flex-col h-auto py-3 gap-1"
          >
            {isDownloading ? <Loader size="sm" /> : <Download className="w-4 h-4" />}
            <span className="text-[10px]">Download</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareEvent}
            className="flex-col h-auto py-3 gap-1"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[10px]">Share</span>
          </Button>
        </div>

        {/* Primary Actions */}
        <div className="space-y-3 pt-2">
          {confirmationData?.registrationId && (
            <Button
              className="w-full"
              onClick={() => navigate(`/user/tickets/${confirmationData.registrationId}`, {
                state: { userEmail, email: userEmail }
              })}
            >
              <Ticket className="w-4 h-4 mr-2" />
              View My Ticket
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Browse More Events
          </Button>
        </div>

        {/* Help */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          Need help?{" "}
          <a href="/support" className="text-primary hover:underline">Contact support</a>
          {eventId && (
            <>
              {" "}or{" "}
              <button
                onClick={() => navigate(`/event/${eventId}`)}
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                view event details <ExternalLink className="w-3 h-3" />
              </button>
            </>
          )}
        </p>
      </main>
    </div>
  );
};

export default RegistrationConfirmation;
