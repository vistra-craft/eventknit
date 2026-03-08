import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, User, Gift, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Loader } from "../components/ui/loader";
import { useToast } from "../hooks/useToast";
import { extractErrorMessage, showErrorToast } from "../lib/utils/error";
import { useAuthContext } from "../hooks/useAuthContext";
import { getTransferByToken, acceptTicketTransfer } from "../lib/user-dashboard-api";
import Logo from "../components/Logo";

interface TransferDetails {
  id: string;
  status: string;
  expiresAt: string;
  message?: string;
  ticketType?: string;
  quantity: number;
  fromUser: { firstName: string; lastName: string };
  event: {
    id: string;
    title: string;
    image?: string;
    startDate: string;
    endDate?: string;
    venue?: string;
    location?: string;
  };
  createdAt: string;
}

const TransferAccept: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state: authState } = useAuthContext();
  const token = searchParams.get("token");

  const [transfer, setTransfer] = useState<TransferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const isLoggedIn = !!authState.user;

  useEffect(() => {
    const fetchTransfer = async () => {
      if (!token) {
        setError("No transfer token provided");
        setLoading(false);
        return;
      }

      try {
        const response = await getTransferByToken(token);
        if (response.success && response.data) {
          setTransfer(response.data.transfer);
        } else {
          setError(response.message || "Transfer not found");
        }
      } catch (err) {
        setError(extractErrorMessage(err, "Failed to load transfer details"));
      } finally {
        setLoading(false);
      }
    };

    fetchTransfer();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const response = await acceptTicketTransfer(token);
      if (response.success) {
        setAccepted(true);
        toast({ title: "Transfer Accepted", description: "The ticket has been added to your account" });
      } else {
        toast({ title: "Accept failed", description: response.message || "Failed to accept transfer", variant: "destructive" });
      }
    } catch (err) {
      showErrorToast(toast, err, 'Accept failed', 'Failed to accept transfer');
    } finally {
      setAccepting(false);
    }
  };

  const handleSignIn = () => {
    const returnTo = `/tickets/transfer/accept?token=${token}`;
    navigate(`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader size="default" />
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <Logo className="mx-auto mb-6" />
          <div className="bg-card border border-border/40 rounded-2xl p-8">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Transfer Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || "This transfer link is invalid or has expired."}</p>
            <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Transfer already accepted
  if (transfer.status === "ACCEPTED" || accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <Logo className="mx-auto mb-6" />
          <div className="bg-card border border-border/40 rounded-2xl p-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Transfer Accepted</h1>
            <p className="text-muted-foreground mb-6">
              {accepted
                ? "The ticket has been added to your account."
                : "This transfer has already been accepted."}
            </p>
            {isLoggedIn && (
              <Button onClick={() => navigate("/user/tickets")}>View My Tickets</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Transfer cancelled
  if (transfer.status === "CANCELLED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <Logo className="mx-auto mb-6" />
          <div className="bg-card border border-border/40 rounded-2xl p-8">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Transfer Cancelled</h1>
            <p className="text-muted-foreground mb-6">This transfer has been cancelled by the sender.</p>
            <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Transfer expired
  if (transfer.status === "EXPIRED" || (transfer.expiresAt && new Date(transfer.expiresAt) < new Date())) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <Logo className="mx-auto mb-6" />
          <div className="bg-card border border-border/40 rounded-2xl p-8">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Transfer Expired</h1>
            <p className="text-muted-foreground mb-6">This transfer link has expired. Please ask the sender to create a new transfer.</p>
            <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // PENDING transfer - show details and accept button
  const senderName = `${transfer.fromUser.firstName} ${transfer.fromUser.lastName}`.trim();
  const eventLocation = transfer.event.venue || transfer.event.location || "TBA";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="max-w-md w-full">
        <Logo className="mx-auto mb-6" />

        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
          {/* Event image */}
          {transfer.event.image && (
            <img
              src={transfer.event.image}
              alt={transfer.event.title}
              className="w-full h-48 object-cover"
            />
          )}

          <div className="p-6">
            {/* Transfer info */}
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{senderName}</span> wants to transfer a ticket to you
              </p>
            </div>

            {transfer.message && (
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground italic">"{transfer.message}"</p>
              </div>
            )}

            {/* Event details */}
            <h2 className="text-lg font-bold text-foreground mb-3">{transfer.event.title}</h2>

            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                {formatDate(transfer.event.startDate)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {eventLocation}
              </p>
              {transfer.ticketType && (
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 flex-shrink-0" />
                  {transfer.ticketType} {transfer.quantity > 1 ? `x${transfer.quantity}` : ""}
                </p>
              )}
            </div>

            {/* Expiry info */}
            {transfer.expiresAt && (
              <p className="text-xs text-muted-foreground mb-5">
                Expires {formatDate(transfer.expiresAt)}
              </p>
            )}

            {/* Action */}
            {isLoggedIn ? (
              <Button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full"
                size="lg"
              >
                {accepting ? "Accepting..." : "Accept Transfer"}
              </Button>
            ) : (
              <div className="space-y-3">
                <Button onClick={handleSignIn} className="w-full" size="lg">
                  Sign In to Accept
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  You need an account to receive this ticket
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferAccept;
