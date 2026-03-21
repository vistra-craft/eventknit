import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Calendar, MapPin, Globe, Ticket as TicketIcon, CheckCircle2, RotateCcw, AlertTriangle, Clock, ShieldCheck, LogIn, LogOut, DoorOpen } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { getTicket, getTicketPublic, downloadTicketPDF, checkRefundEligibility, requestRefund } from "@/lib/ticket-api";
import { getPaymentStatus } from "@/lib/payment-api";
import type { TicketData, RefundEligibility } from "@/lib/ticket-api";
import { Textarea } from "@/components/ui/textarea";
import { getEventById } from "@/lib/event-api";
import { extractErrorMessage } from "@/lib/utils/error";
import { useLocation, useSearchParams } from "react-router-dom";

type TicketEventDetails = {
  startDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  venue?: string;
  isOnline?: boolean;
  onlineLink?: string;
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
  // Payment status
  const [paymentInfo, setPaymentInfo] = useState<{ paymentStatus: string; paymentMethod: string | null; totalAmount: number } | null>(null);
  // Refund state
  const [refundEligibility, setRefundEligibility] = useState<RefundEligibility | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundSubmitted, setRefundSubmitted] = useState(false);

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
            authErrorMessage = extractErrorMessage(authError, '');
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
            checkedInAt?: string | null;
            checkedOutAt?: string | null;
            isCurrentlyInside?: boolean;
          };

          type TicketResponseWithRegistration = {
            registration: RegistrationPayload;
            ticketLineItems?: Array<{ ticketType: string; quantity: number; unitPrice: number; totalPrice: number }>;
            currency?: string;
            qrCode?: string | null;
            checkedInAt?: string | null;
            checkedOutAt?: string | null;
            isCurrentlyInside?: boolean;
          };

          const ticketData: TicketData = (() => {
            if (
              data &&
              typeof data === "object" &&
              "registration" in data &&
              (data as TicketResponseWithRegistration).registration
            ) {
              const resp = data as TicketResponseWithRegistration;
              const reg = resp.registration;
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
                ticketLineItems: resp.ticketLineItems,
                currency: resp.currency,
                qrCode: resp.qrCode || undefined,
                backupCode: reg.backupCode || undefined,
                createdAt: reg.createdAt || new Date().toISOString(),
                checkedInAt: resp.checkedInAt,
                checkedOutAt: resp.checkedOutAt,
                isCurrentlyInside: resp.isCurrentlyInside,
              };
            }
            return data as TicketData;
          })();

          setTicket(ticketData);

          // Fetch payment status (only for authenticated users)
          if (isAuthenticated) {
            try {
              const paymentRes = await getPaymentStatus(ticketData.registrationId);
              if (paymentRes.success && paymentRes.data) {
                setPaymentInfo(paymentRes.data);
              }
            } catch {
              // Non-critical — payment info is supplementary
            }
          }

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
        const errorMessage = extractErrorMessage(err, "We couldn't load your ticket. Please check your connection and try again.");
        setError(errorMessage);
        toast({
          title: "Couldn't load ticket",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [registrationId, isAuthenticated, location.state, user?.email, toast, searchParams]);

  // Fetch refund eligibility when ticket loads (only for authenticated users)
  useEffect(() => {
    const fetchRefundEligibility = async () => {
      if (!registrationId || !isAuthenticated || !ticket) return;
      try {
        setRefundLoading(true);
        const response = await checkRefundEligibility(registrationId);
        if (response.success && response.data) {
          setRefundEligibility(response.data);
        }
      } catch {
        // Silently fail — refund section just won't show
      } finally {
        setRefundLoading(false);
      }
    };
    fetchRefundEligibility();
  }, [registrationId, isAuthenticated, ticket]);

  const handleRefundRequest = async () => {
    if (!registrationId || refundReason.trim().length < 10) {
      toast({
        title: "Invalid reason",
        description: "Please provide a reason with at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      setRefundSubmitting(true);
      const response = await requestRefund(registrationId, refundReason.trim());
      if (response.success) {
        setRefundSubmitted(true);
        setShowRefundForm(false);
        toast({
          title: "Refund requested",
          description: "Your refund request has been submitted. You'll be notified once it's processed.",
        });
      }
    } catch (err) {
      toast({
        title: "Refund request failed",
        description: extractErrorMessage(err, "We couldn't process your refund request. Please try again or contact support."),
        variant: "destructive",
      });
    } finally {
      setRefundSubmitting(false);
    }
  };

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
      toast({
        title: "Download failed",
        description: extractErrorMessage(err, "We couldn't download your ticket. Please try again or check your email for a copy."),
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
              <Badge variant="outline" className="bg-success/5 text-success border-success">
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

                {/* Online Event Link — only visible to ticket holders */}
                {eventData?.isOnline && eventData?.onlineLink && (
                  <div className="col-span-full">
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                      <Globe className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold mb-1">Online Event Link</p>
                        <a
                          href={eventData.onlineLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {eventData.onlineLink}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attendee Info */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Attendee</p>
              <p className="text-sm text-muted-foreground">{ticket.attendeeName}</p>
              <p className="text-sm text-muted-foreground">{ticket.attendeeEmail}</p>
            </div>

            {/* Check-in Status */}
            {ticket.checkedInAt && (
              <div className="space-y-2 pb-4 border-b">
                <p className="text-sm font-medium">Check-in Status</p>
                <div className="flex flex-wrap items-center gap-2">
                  {ticket.isCurrentlyInside ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      <DoorOpen className="w-3 h-3 mr-1" />
                      Currently Inside
                    </Badge>
                  ) : ticket.checkedOutAt ? (
                    <Badge variant="secondary">
                      <LogOut className="w-3 h-3 mr-1" />
                      Checked Out
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <LogIn className="w-3 h-3 mr-1" />
                      Checked In
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Checked in {new Date(ticket.checkedInAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </p>
              </div>
            )}

            {/* Ticket Details */}
            {ticket.ticketLineItems && ticket.ticketLineItems.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Tickets</p>
                <div className="space-y-1">
                  {ticket.ticketLineItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.ticketType} x{item.quantity}</span>
                      {item.totalPrice > 0 && (
                        <span className="font-medium">{ticket.currency || 'USD'} {item.totalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : ticket.ticketType ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ticket Type</p>
                <p className="text-sm text-muted-foreground">{ticket.ticketType}</p>
              </div>
            ) : null}

            {/* Payment Info */}
            {paymentInfo && paymentInfo.totalAmount > 0 && (
              <div className="space-y-2 pt-3 border-t border-border">
                <p className="text-sm font-medium">Payment</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      className={
                        paymentInfo.paymentStatus === 'COMPLETED'
                          ? 'bg-success/10 text-success border-0'
                          : paymentInfo.paymentStatus === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-600 border-0'
                            : 'bg-destructive/10 text-destructive border-0'
                      }
                    >
                      {paymentInfo.paymentStatus === 'COMPLETED' ? 'Paid' : paymentInfo.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{ticket.currency || 'KES'} {paymentInfo.totalAmount.toLocaleString()}</span>
                  </div>
                  {paymentInfo.paymentMethod && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Method</span>
                      <span className="capitalize">{paymentInfo.paymentMethod.toLowerCase()}</span>
                    </div>
                  )}
                </div>
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

        {/* Refund Section */}
        {isAuthenticated && !refundLoading && refundEligibility && !refundSubmitted && (
          <Card className="mb-6 border-border/40">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  refundEligibility.eligible
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {refundEligibility.eligible ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold mb-1">Refund Policy</h3>
                  <p className="text-sm text-muted-foreground">{refundEligibility.message}</p>

                  {refundEligibility.eligible && refundEligibility.deadline && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        Deadline: {new Date(refundEligibility.deadline).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                        {" "}({refundEligibility.daysUntilEvent} days before event)
                      </span>
                    </div>
                  )}

                  {refundEligibility.eligible && refundEligibility.refundAmount > 0 && (
                    <p className="text-sm font-medium mt-2">
                      Refund amount: {refundEligibility.currency} {refundEligibility.refundAmount.toFixed(2)}
                      {refundEligibility.refundPercentage < 100 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({refundEligibility.refundPercentage}% of purchase)
                        </span>
                      )}
                    </p>
                  )}

                  {refundEligibility.policyText && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{refundEligibility.policyText}</p>
                  )}

                  {refundEligibility.eligible && !showRefundForm && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      onClick={() => setShowRefundForm(true)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Request Refund
                    </Button>
                  )}

                  {showRefundForm && (
                    <div className="mt-3 space-y-3">
                      <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            This action cannot be undone. Your ticket will be cancelled and the refund will be processed according to the event's refund policy.
                          </p>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Please tell us why you'd like a refund (minimum 10 characters)..."
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        className="min-h-[80px] resize-none text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={refundSubmitting || refundReason.trim().length < 10}
                          onClick={handleRefundRequest}
                        >
                          {refundSubmitting ? "Submitting..." : "Confirm Refund Request"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setShowRefundForm(false); setRefundReason(""); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Refund Submitted Confirmation */}
        {refundSubmitted && (
          <Alert className="mb-6 border-success/20 bg-success/5">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <AlertTitle className="text-success">Refund Requested</AlertTitle>
            <AlertDescription>
              Your refund request has been submitted and is being reviewed. You'll receive an email notification once it's processed.
            </AlertDescription>
          </Alert>
        )}

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


