import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Ticket,
  Download,
  Calendar,
  Share2,
  Mail,
  Lock,
  ArrowLeft,
  ExternalLink,
  Clock,
  MapPin,
  User,
  CreditCard,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { getEventById } from "@/lib/event-api";
import { downloadTicket } from "@/lib/utils/ticket";
import { shareEvent } from "@/lib/utils/share";
import { useToast } from "@/hooks/use-toast";
import { setupPassword } from "@/lib/auth-api";
import { downloadTicketPDF, resendTicketEmail } from "@/lib/ticket-api";
import { setAccessToken } from "@/lib/api";

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
  discount?: number;
  promoCode?: string;
}

const RegistrationConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordSetSuccess, setPasswordSetSuccess] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // Get confirmation data from location state or construct from event
  const confirmationData = location.state as ConfirmationData | null;

  // Store access token if provided (for guest users) and refresh auth
  useEffect(() => {
    const state = location.state as any;
    if (state?.accessToken) {
      setAccessToken(state.accessToken);
      // Trigger auth refresh to load user data
      refreshProfile().catch(() => {
        // Silently fail - token might be invalid
      });
    }
  }, [location.state, refreshProfile]);

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

  // Determine if user is guest (new account created)
  const isGuestUser = confirmationData?.isGuestUser ?? false;
  const userEmail = confirmationData?.userEmail || user?.email || "";

  // Format event date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Handle password setup
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    // Validate password
    if (passwordData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    if (!/(?=.*[a-zA-Z])/.test(passwordData.password)) {
      setPasswordError("Password must contain at least one letter");
      return;
    }

    if (!/(?=.*\d)/.test(passwordData.password)) {
      setPasswordError("Password must contain at least one number");
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setSettingPassword(true);
    try {
      // TODO: Implement password setup API call
      // await setupPassword(userEmail, passwordData.password);
      
      toast({
        title: "Password set successfully!",
        description: "You can now log in with your email and password.",
      });

      // Clear password form
      setPasswordData({ password: "", confirmPassword: "" });
    } catch (error) {
      setPasswordError("Failed to set password. Please try again.");
    } finally {
      setSettingPassword(false);
    }
  };

  // Handle add to calendar
  const handleAddToCalendar = (type: "google" | "apple" | "outlook") => {
    if (!eventData && !confirmationData) return;

    const event = eventData || confirmationData;
    const startDate = event?.startDate || event?.eventDate;
    const endDate = event?.endDate || startDate;
    const startTime = event?.startTime || event?.eventTime || "10:00";
    const location = event?.location || event?.eventLocation || "";

    const formatDateForCalendar = (date: string, time?: string) => {
      const d = new Date(date);
      if (time) {
        const [hours, minutes] = time.split(":");
        d.setHours(parseInt(hours), parseInt(minutes));
      }
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const start = formatDateForCalendar(startDate, startTime);
    const end = formatDateForCalendar(endDate || startDate, event?.endTime || "18:00");

    let url = "";

    if (type === "google") {
      url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        event?.title || event?.eventTitle || ""
      )}&dates=${start}/${end}&details=${encodeURIComponent(
        event?.description || ""
      )}&location=${encodeURIComponent(location)}`;
    } else if (type === "apple") {
      // Generate .ics file for Apple Calendar
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventKnit//Event Calendar//EN
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${event?.title || event?.eventTitle || ""}
DESCRIPTION:${event?.description || ""}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

      const blob = new Blob([icsContent], { type: "text/calendar" });
      const url2 = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url2;
      link.download = `${event?.title || "event"}.ics`;
      link.click();
      URL.revokeObjectURL(url2);
      return;
    } else if (type === "outlook") {
      url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
        event?.title || event?.eventTitle || ""
      )}&startdt=${start}&enddt=${end}&body=${encodeURIComponent(
        event?.description || ""
      )}&location=${encodeURIComponent(location)}`;
    }

    if (url) {
      window.open(url, "_blank");
    }
  };

  // Handle download ticket
  const handleDownloadTicket = async () => {
    if (!confirmationData?.registrationId) {
      toast({
        title: "Error",
        description: "Registration ID not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Downloading ticket...",
        description: "Your ticket will be downloaded shortly.",
      });
      
      await downloadTicketPDF(confirmationData.registrationId);
      
      toast({
        title: "Ticket downloaded!",
        description: "Your ticket has been downloaded successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to download ticket. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle share event
  const handleShareEvent = () => {
    if (!eventData && !confirmationData) return;

    const event = eventData || confirmationData;
    const shareData = {
      title: event?.title || event?.eventTitle || "",
      text: `Check out ${event?.title || event?.eventTitle || ""} on EventKnit!`,
      url: window.location.origin + `/event/${eventId || event?.eventId || ""}`,
    };

    shareEvent(shareData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (!confirmationData && !eventData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Alert variant="destructive">
            <AlertDescription>
              Confirmation data not found. Please return to the event page.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const event = eventData || confirmationData;
  const isFree = confirmationData?.isFreeEvent ?? event?.isFree ?? false;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {/* Success Header */}
        <div className="text-center mb-8 mt-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            🎉 You're Registered!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your registration for <strong>{event?.title || event?.eventTitle}</strong> is confirmed.
          </p>
          {confirmationData?.registrationId && (
            <p className="text-sm text-muted-foreground mt-2">
              Registration ID: <span className="font-mono">{confirmationData.registrationId.slice(0, 8)}...</span>
            </p>
          )}
        </div>

        {/* Account Setup Prompt (Guest Users Only) */}
        {isGuestUser && !isAuthenticated && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Create a password to access your account
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                    Setting a password lets you manage your tickets, register for events faster, and access your event dashboard.
                  </p>

                  {!passwordSetSuccess ? (
                    <form onSubmit={handleSetPassword} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={passwordData.password}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, password: e.target.value })
                            }
                            placeholder="Enter password"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                            }
                            placeholder="Confirm password"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Must be at least 8 characters and contain at least one letter and one number.
                      </p>
                      {passwordError && (
                        <Alert variant="destructive" className="text-sm">
                          <AlertDescription>{passwordError}</AlertDescription>
                        </Alert>
                      )}
                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          disabled={settingPassword}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {settingPassword ? "Setting..." : "Set Password"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPasswordData({ password: "", confirmPassword: "" })}
                        >
                          I'll do this later
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✓ Password set successfully! You can now log in with your email and password.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Confirmation Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="flex-1">
                <p className="mb-1">
                  <strong>Check your email!</strong> A confirmation email with your ticket{isFree ? "" : " and receipt"} is being sent to <strong>{userEmail}</strong>.
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  📧 Email is being sent in the background. If you don't receive it within a few minutes, you can resend it below or view your ticket online.
                </p>
              </div>
              {confirmationData?.registrationId && isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await resendTicketEmail(confirmationData.registrationId);
                      toast({
                        title: "Email resent!",
                        description: "Your ticket email has been resent successfully.",
                      });
                    } catch (error) {
                      const errorMessage = error instanceof Error ? error.message : "Failed to resend email";
                      toast({
                        title: "Error",
                        description: errorMessage,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="ml-auto"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Resend Email
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Ticket Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Registration Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Info */}
            <div className="space-y-3 pb-4 border-b">
              <h3 className="font-semibold text-lg">{event?.title || event?.eventTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-muted-foreground">
                      {formatDate(event?.startDate || event?.eventDate)}
                      {event?.startTime || event?.eventTime ? ` at ${formatTime(event?.startTime || event?.eventTime)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground">
                      {event?.location || event?.eventLocation || "TBA"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets */}
            {confirmationData?.tickets && confirmationData.tickets.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Tickets</h4>
                {confirmationData.tickets.map((ticket, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{ticket.quantity}x {ticket.name}</p>
                        {!isFree && (
                          <p className="text-sm text-muted-foreground">
                            {event?.currency || "$"}{ticket.price.toFixed(2)} each
                          </p>
                        )}
                      </div>
                    </div>
                    {!isFree && (
                      <p className="font-semibold">
                        {event?.currency || "$"}{(ticket.price * ticket.quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Payment Info (if paid) */}
            {!isFree && confirmationData && (
              <div className="pt-4 border-t space-y-2">
                {confirmationData.discount && confirmationData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">
                      -{event?.currency || "$"}{confirmationData.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2">
                  <span>Total</span>
                  <span>{event?.currency || "$"}{confirmationData.totalPrice?.toFixed(2) || "0.00"}</span>
                </div>
                {confirmationData.paymentMethod && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Paid via {confirmationData.paymentMethod}</span>
                    {confirmationData.paymentId && (
                      <span className="font-mono text-xs">({confirmationData.paymentId.slice(0, 8)}...)</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={() => handleAddToCalendar("google")}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Add to Google Calendar</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Get reminders and sync with your calendar
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={() => handleAddToCalendar("apple")}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Add to Apple Calendar</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Download .ics file for Apple Calendar
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={handleDownloadTicket}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">Download Ticket</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Get your ticket with QR code
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={handleShareEvent}
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  <span className="font-semibold">Share Event</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Tell your friends about this event
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          {confirmationData?.registrationId ? (
            <Button
              size="lg"
              onClick={() => navigate(`/user/tickets/${confirmationData.registrationId}`, { 
                state: { 
                  userEmail: confirmationData.userEmail || userEmail,
                  email: confirmationData.userEmail || userEmail,
                } 
              })}
              className="gap-2"
            >
              <Ticket className="w-5 h-5" />
              View My Ticket
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => navigate("/user/dashboard", { state: { eventData: event } })}
              className="gap-2"
            >
              <Ticket className="w-5 h-5" />
              View My Tickets
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Browse More Events
          </Button>
        </div>

        {/* Help Section */}
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Need help? Contact the organizer or visit our{" "}
              <a href="/support" className="text-primary hover:underline">
                support center
              </a>
              .
            </p>
            {eventId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/event/${eventId}`)}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Event Details
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default RegistrationConfirmation;

