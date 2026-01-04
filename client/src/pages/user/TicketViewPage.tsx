import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Calendar, MapPin, Ticket as TicketIcon, CheckCircle2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getTicket, getTicketPublic, downloadTicketPDF } from "@/lib/ticket-api";
import type { TicketData } from "@/lib/ticket-api";
import { getEventById } from "@/lib/event-api";
import { useLocation, useSearchParams } from "react-router-dom";

type TicketEventDetails = {
  startDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  venue?: string;
};

type TicketLocationState = {
  userEmail?: string;
  email?: string;
} | null;

const TicketViewPage: React.FC = () => {
  const { registrationId } = useParams<{ registrationId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [eventData, setEventData] = useState<TicketEventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!registrationId) {
        setError("Registration ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        let ticketResponse;
        let authErrorMessage: string | null = null;
        
        // Try authenticated first, fallback to public if not authenticated
        if (isAuthenticated) {
          try {
            ticketResponse = await getTicket(registrationId);
          } catch (authError) {
            authErrorMessage = authError instanceof Error ? authError.message : null;
            // If auth fails, try public endpoint with email from location state or user
            const email = (location.state as TicketLocationState)?.userEmail || user?.email;
            if (email) {
              ticketResponse = await getTicketPublic(registrationId, email);
            } else {
              throw authError;
            }
          }
        } else {
          // Not authenticated - try public endpoint
          const state = location.state as TicketLocationState;
          const email = state?.userEmail || state?.email || searchParams.get('email');
          if (email) {
            ticketResponse = await getTicketPublic(registrationId, email);
          } else {
            setError("Email is required to view ticket. Please log in or provide your email.");
            setLoading(false);
            return;
          }
        }
        
        if (ticketResponse && ticketResponse.success && ticketResponse.data) {
          const data = ticketResponse.data as unknown;

          type RegistrationPayload = {
            id: string;
            eventId?: string;
            event?: { title?: string | null } | null;
            attendee?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
            ticketType?: string | null;
            backupCode?: string | null;
            createdAt?: string | null;
          };

          type TicketResponseWithRegistration = {
            registration: RegistrationPayload;
            qrCode?: string | null;
          };

          const ticketData: TicketData = (() => {
            if (
              data &&
              typeof data === "object" &&
              "registration" in data &&
              (data as TicketResponseWithRegistration).registration
            ) {
              const reg = (data as TicketResponseWithRegistration).registration;
              return {
                id: reg.id,
                registrationId: reg.id,
                eventId: reg.eventId || "",
                eventTitle: reg.event?.title || "",
                attendeeName:
                  `${reg.attendee?.firstName || ""} ${reg.attendee?.lastName || ""}`.trim() ||
                  reg.attendee?.email ||
                  "",
                attendeeEmail: reg.attendee?.email || "",
                ticketType: reg.ticketType || undefined,
                qrCode: (data as TicketResponseWithRegistration).qrCode || undefined,
                backupCode: reg.backupCode || undefined,
                createdAt: reg.createdAt || new Date().toISOString(),
              };
            }
            return data as TicketData;
          })();

          setTicket(ticketData);

          const eventIdFromTicket = ticketData.eventId;
          if (eventIdFromTicket) {
            const eventResponse = await getEventById(eventIdFromTicket);
            if (eventResponse.success && eventResponse.data?.event) {
              setEventData(eventResponse.data.event as TicketEventDetails);
            }
          }
        } else {
          setError(ticketResponse?.message || authErrorMessage || "Ticket not found");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load ticket";
        setError(errorMessage || "Ticket not found");
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [registrationId, isAuthenticated, location.state, user?.email, toast, searchParams]);

  const handleDownload = async () => {
    if (!registrationId) return;

    try {
      setDownloading(true);
      await downloadTicketPDF(registrationId);
      toast({
        title: "Ticket downloaded!",
        description: "Your ticket has been downloaded successfully.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to download ticket";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTitle>Ticket issue</AlertTitle>
            <AlertDescription>{error || "Ticket not found"}</AlertDescription>
          </Alert>
          <BackButton to="/user/dashboard" label="Back to Dashboard" className="mt-4" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {/* Header */}
        <div className="mb-6">
          <BackButton to="/user/dashboard" label="Back to Dashboard" className="mb-4" />
          <h1 className="text-3xl font-bold mb-2">Your Ticket</h1>
          <p className="text-muted-foreground">Event registration confirmation</p>
        </div>

        {/* Ticket Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TicketIcon className="w-5 h-5" />
                {ticket.eventTitle}
              </CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Confirmed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details */}
            {eventData && (
              <div className="space-y-4 pb-4 border-b">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventData.startDate && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Date & Time</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(eventData.startDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {eventData.startTime && ` at ${eventData.startTime}`}
                        </p>
                      </div>
                    </div>
                  )}
                  {eventData.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {eventData.venue ? `${eventData.venue}, ` : ""}
                          {eventData.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attendee Info */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Attendee</p>
              <p className="text-sm text-muted-foreground">{ticket.attendeeName}</p>
              <p className="text-sm text-muted-foreground">{ticket.attendeeEmail}</p>
            </div>

            {/* Ticket Type */}
            {ticket.ticketType && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ticket Type</p>
                <p className="text-sm text-muted-foreground">{ticket.ticketType}</p>
              </div>
            )}

            {/* QR Code */}
            {ticket.qrCode && (
              <div className="flex flex-col items-center space-y-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">QR Code</p>
                <img
                  src={ticket.qrCode}
                  alt="Ticket QR Code"
                  className="w-48 h-48 border-2 border-border rounded"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Present this QR code at the event entrance
                </p>
                {ticket.backupCode && (
                  <div className="mt-4 p-3 bg-background border border-border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Backup Code</p>
                    <p className="text-lg font-mono font-semibold">{ticket.backupCode}</p>
                    <p className="text-xs text-muted-foreground mt-1">Use if QR code doesn't work</p>
                  </div>
                )}
              </div>
            )}

            {/* Backup Code - Only show if not already shown with QR code */}
            {ticket.backupCode && !ticket.qrCode && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Backup Code</p>
                <p className="text-sm font-mono bg-muted p-2 rounded">{ticket.backupCode}</p>
                <p className="text-xs text-muted-foreground">
                  Use this code if your QR code doesn't work
                </p>
              </div>
            )}

            {/* Registration ID */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Registration ID</p>
              <p className="text-sm font-mono text-muted-foreground">{ticket.registrationId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? "Downloading..." : "Download Ticket"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/user/dashboard")}
            className="flex-1"
          >
            View All Tickets
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TicketViewPage;


