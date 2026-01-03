import React, { useRef, useState, useEffect } from "react";
import { Download, QrCode, Share2, Printer, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EventData, User } from "./EventAttendeeView";
import { apiGet } from "@/lib/api";

interface TicketData {
  id: string;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketType?: string;
  qrCode: string;
  backupCode?: string;
  createdAt: string;
}

interface EventMyBadgeProps {
  event: EventData;
  user: User;
}

export const EventMyBadge: React.FC<EventMyBadgeProps> = ({ event, user }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ticket data when registrationId is available
  useEffect(() => {
    const fetchTicketData = async () => {
      if (!event.registrationId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiGet<{ success: boolean; data: TicketData }>(
          `/tickets/${event.registrationId}`
        );
        if (response.success && response.data) {
          setTicketData(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch ticket data:', err);
        setError('Unable to load ticket data');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [event.registrationId]);

  // Use real backup code or generate a fallback
  const badgeCode = ticketData?.backupCode || event.backupCode ||
    `EVT-${event.id?.slice(0, 4).toUpperCase() || 'XXXX'}-${user.email?.slice(0, 3).toUpperCase() || 'USR'}`;

  // Use real ticket type or default
  const ticketType = ticketData?.ticketType || event.ticketType || 'ATTENDEE';

  const formatEventDate = () => {
    const startDate = new Date(event.date);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };

    if (event.endDate && event.endDate !== event.date) {
      const endDate = new Date(event.endDate);
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    }

    return startDate.toLocaleDateString('en-US', options);
  };

  const handleDownload = async () => {
    if (event.registrationId) {
      // Try to download PDF from API
      try {
        const response = await fetch(`/api/v1/tickets/${event.registrationId}/download`, {
          credentials: 'include',
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `badge-${event.registrationId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return;
        }
      } catch (err) {
        console.error('Failed to download PDF:', err);
      }
    }
    // Fallback to print
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name}'s Badge - ${event.title}`,
          text: `I'm attending ${event.title}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-md mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-2 text-muted-foreground">Loading badge...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Badge Card */}
        {!loading && (
          <div ref={badgeRef} className="print:shadow-none">
            <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
              {/* Badge Header - Event Info */}
              <div className="bg-primary text-primary-foreground p-6 text-center">
                <h2 className="text-lg font-bold">{event.title}</h2>
                <p className="text-sm text-white/80 mt-1">{formatEventDate()}</p>
                <p className="text-sm text-white/70 mt-0.5">{event.venue || event.location}</p>
              </div>

              {/* Badge Body - Attendee Info */}
              <CardContent className="p-8 bg-white">
                <div className="text-center">
                  {/* Avatar */}
                  <Avatar
                    src={user.profileImage}
                    name={user.name}
                    alt={user.name}
                    size="xl"
                    className="mx-auto mb-4 ring-4 ring-primary/20"
                  />

                  {/* Name & Details */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {user.name}
                  </h3>
                  {user.title && (
                    <p className="text-gray-600 font-medium">{user.title}</p>
                  )}
                  {user.company && (
                    <p className="text-gray-500">{user.company}</p>
                  )}

                  {/* Badge Type */}
                  <div className="mt-4 mb-6">
                    <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold uppercase">
                      {ticketType}
                    </span>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    {ticketData?.qrCode ? (
                      <img
                        src={ticketData.qrCode}
                        alt="Badge QR Code"
                        className="w-32 h-32 rounded-xl"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <QrCode className="w-12 h-12 text-gray-400 mx-auto" />
                          <p className="text-xs text-gray-400 mt-1">
                            {event.registrationId ? 'Loading...' : 'No ticket'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Badge Code */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Badge Code</p>
                    <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                      {badgeCode}
                    </p>
                  </div>
                </div>
              </CardContent>

              {/* Badge Footer */}
              <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
                {event.hashtag && (
                  <p className="text-sm text-primary font-medium">
                    #{event.hashtag}
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        {!loading && (
          <div className="mt-8 space-y-3 print:hidden">
            <Button
              onClick={handleDownload}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
              disabled={!event.registrationId}
            >
              <Download className="w-5 h-5 mr-2" />
              Download Badge
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>

              <Button
                variant="outline"
                onClick={handleShare}
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!loading && (
          <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
            <p>Present this badge at the event for check-in</p>
            <p className="mt-1">Badge code can be used for quick verification</p>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            width: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default EventMyBadge;
