import React, { useRef, useState, useEffect } from "react";
import { Download, QrCode, Share2, Printer, AlertCircle, Armchair } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EventData, User } from "./EventAttendeeView";
import { getTicket, downloadTicketPDF, type TicketData } from "@/lib/ticket-api";

interface EventMyBadgeProps {
  event: EventData;
  user: User;
}

export const EventMyBadge: React.FC<EventMyBadgeProps> = ({ event, user }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (!event.registrationId) return;

    let cancelled = false;
    const fetchTicket = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getTicket(event.registrationId!);
        if (!cancelled && response.success && response.data) {
          setTicketData(response.data);
        }
      } catch {
        if (!cancelled) setError('Unable to load ticket data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchTicket();
    return () => { cancelled = true; };
  }, [event.registrationId]);

  const badgeCode =
    ticketData?.backupCode ??
    event.backupCode ??
    `EVT-${(event.id?.slice(0, 4) ?? 'XXXX').toUpperCase()}-${(user.email?.slice(0, 3) ?? 'USR').toUpperCase()}`;

  const ticketType = ticketData?.ticketType ?? event.ticketType ?? 'ATTENDEE';

  // Use seat from fetched ticket; fall back to seat already on event (populated by DashboardMyEvent)
  const seat = ticketData?.seat ?? event.seat;

  const formatEventDate = (): string => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const start = new Date(event.date).toLocaleDateString('en-US', opts);
    if (event.endDate && event.endDate !== event.date) {
      const end = new Date(event.endDate).toLocaleDateString('en-US', opts);
      return `${start} – ${end}`;
    }
    return start;
  };

  const handleDownload = async () => {
    if (!event.registrationId || downloadingPDF) return;
    setDownloadingPDF(true);
    try {
      await downloadTicketPDF(event.registrationId);
    } catch {
      // downloadTicketPDF handles user-visible errors internally
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${user.name}'s Badge — ${event.title}`,
        text: `I'm attending ${event.title}!`,
        url: window.location.href,
      });
    } catch {
      // user cancelled or API not supported — silently ignore
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-md mx-auto">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader size="lg" />
            <span className="ml-2 text-muted-foreground">Loading badge…</span>
          </div>
        )}

        {/* Error */}
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

              {/* Event header */}
              <div className="bg-primary text-primary-foreground p-6 text-center">
                <h2 className="text-lg font-bold">{event.title}</h2>
                <p className="text-sm text-white/80 mt-1">{formatEventDate()}</p>
                <p className="text-sm text-white/70 mt-0.5">{event.venue ?? event.location}</p>
              </div>

              {/* Attendee info */}
              <CardContent className="p-8 bg-white">
                <div className="text-center">
                  <Avatar
                    src={user.profileImage}
                    name={user.name}
                    alt={user.name}
                    size="xl"
                    className="mx-auto mb-4 ring-4 ring-primary/20"
                  />

                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{user.name}</h3>
                  {user.title && <p className="text-gray-600 font-medium">{user.title}</p>}
                  {user.company && <p className="text-gray-500">{user.company}</p>}

                  {/* Ticket type badge */}
                  <div className="mt-4 mb-2">
                    <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold uppercase">
                      {ticketType}
                    </span>
                  </div>

                  {/* Seat allocation strip */}
                  {seat && (
                    <div className="mt-3 mb-5 mx-auto max-w-xs">
                      <div className="flex items-center justify-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                        <Armchair className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-xs text-gray-500 leading-none mb-0.5">Your Seat</p>
                          <p className="font-bold text-primary text-sm leading-none">
                            {seat.seatIdentifier}
                          </p>
                        </div>
                        {(seat.sectionId || seat.rowLabel) && (
                          <div className="pl-3 border-l border-primary/20 text-left">
                            {seat.sectionId && (
                              <p className="text-xs text-gray-500 leading-none mb-0.5">Section</p>
                            )}
                            <p className="text-sm font-semibold text-gray-700 leading-none">
                              {[seat.sectionId, seat.rowLabel && `Row ${seat.rowLabel}`]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>
                        )}
                        <Badge className="ml-auto bg-primary/10 text-primary text-[10px] font-semibold uppercase">
                          {seat.seatType}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    {ticketData?.qrCode ? (
                      <img
                        src={ticketData.qrCode}
                        alt="Badge QR Code"
                        className="w-32 h-32 rounded-xl"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-muted border-2 border-dashed border-border rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <QrCode className="w-12 h-12 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.registrationId ? 'Loading…' : 'No ticket'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Badge code */}
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Badge Code</p>
                    <p className="text-lg font-mono font-bold text-foreground tracking-wider">
                      {badgeCode}
                    </p>
                  </div>
                </div>
              </CardContent>

              {/* Footer */}
              <div className="bg-muted px-6 py-4 text-center border-t border-border">
                {event.hashtag && (
                  <p className="text-sm text-primary font-medium">#{event.hashtag}</p>
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
              disabled={!event.registrationId || downloadingPDF}
            >
              <Download className="w-5 h-5 mr-2" />
              {downloadingPDF ? 'Downloading…' : 'Download Badge'}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => window.print()} className="w-full">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>

              <Button variant="outline" onClick={handleShare} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!loading && (
          <div className="mt-6 text-center text-sm text-muted-foreground print:hidden space-y-1">
            <p>Present this badge at the event for check-in</p>
            {seat && (
              <p className="text-primary font-medium">
                Proceed to <strong>{seat.sectionId ?? 'your section'}</strong> — Seat {seat.seatIdentifier}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:shadow-none,
          .print\\:shadow-none * { visibility: visible; }
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
