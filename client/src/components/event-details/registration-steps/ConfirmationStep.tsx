import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Calendar, MapPin, Mail, Download, Share2 } from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { useNavigate } from 'react-router-dom';
import type { EventData } from '@/types/event';
import type { TicketSelection } from '../UnifiedRegistrationModal';
import { downloadTicketPDF } from '@/lib/ticket-api';
import { shareEvent } from '@/lib/utils/share';
import { useToast } from '@/hooks/useToast';

interface RegistrationData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  registrationData?: Record<string, string | boolean>;
  [key: string]: unknown;
}

interface PaymentData {
  method: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  registrationId?: string;
  [key: string]: unknown;
}

interface ConfirmationStepProps {
  event: EventData;
  selectedTickets: TicketSelection;
  registrationData: RegistrationData | null;
  paymentData: PaymentData | null;
  onClose: () => void;
}

export const ConfirmationStep = ({
  event,
  selectedTickets,
  registrationData,
  paymentData,
  onClose,
}: ConfirmationStepProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const ticketBreakdown = Object.entries(selectedTickets)
    .filter(([, qty]) => qty > 0)
    .map(([name, qty]) => {
      const ticket = event.ticketTypes?.find((t) => t.name === name);
      return {
        name,
        quantity: qty,
        price: ticket?.price || 0,
      };
    });

  const handleViewTickets = () => {
    navigate('/my-tickets');
    onClose();
  };

  const handleDownloadTicket = async () => {
    if (!paymentData?.registrationId) {
      toast({
        title: "Info",
        description: "Ticket will be available in your email shortly.",
      });
      return;
    }

    setIsDownloading(true);
    try {
      await downloadTicketPDF(paymentData.registrationId);
      toast({
        title: "Downloaded",
        description: "Ticket PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Error",
        description: "Failed to download ticket. Check your email for the ticket.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareEvent = async () => {
    const shared = await shareEvent(event.title, event.id);
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

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-6">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
        <p className="text-muted-foreground">
          {event.isFree
            ? "You're all set for the event"
            : 'Your payment has been processed successfully'}
        </p>
      </div>

      {/* Event Details Card */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex gap-4">
          {event.image && (
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{event.title}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {event.date || new Date(event.startDate).toLocaleDateString()} •{' '}
                  {event.time || event.startTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.venue || event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ticket Details */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Your Tickets</h4>
        <div className="space-y-2">
          {ticketBreakdown.map((item) => (
            <div key={item.name} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">x {item.quantity}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total Tickets</span>
              <span className="text-primary">{totalTickets}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Confirmation Email Notice */}
      <Card className="p-4 bg-primary/5 border-primary">
        <div className="flex gap-3">
          <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-primary mb-1">Check Your Email</h4>
            <p className="text-sm text-primary">
              A confirmation email with your ticket(s) and QR code has been sent to{' '}
              <strong>{registrationData?.email || 'your email'}</strong>
            </p>
          </div>
        </div>
      </Card>

      {/* Payment Info (if paid) */}
      {!event.isFree && paymentData && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Payment Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-mono text-xs">{paymentData.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-semibold">
                {paymentData.currency} {paymentData.amount?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-success font-medium">Paid</span>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={handleViewTickets}>
          View My Tickets
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={handleDownloadTicket} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <Loader size="sm" className="mr-2" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download
              </>
            )}
          </Button>
          <Button variant="outline" size="lg" onClick={handleShareEvent}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <Button variant="ghost" size="lg" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <p>Need help? Contact the organizer or visit our support center.</p>
      </div>
    </div>
  );
};

