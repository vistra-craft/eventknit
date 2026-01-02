import React, { useRef } from "react";
import { Download, QrCode, Share2, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import type { EventData, User } from "./EventAttendeeView";

interface EventMyBadgeProps {
  event: EventData;
  user: User;
}

export const EventMyBadge: React.FC<EventMyBadgeProps> = ({ event, user }) => {
  const badgeRef = useRef<HTMLDivElement>(null);

  // Generate a mock badge code (in production, this would come from the registration)
  const badgeCode = `EVT-${event.id?.slice(0, 4).toUpperCase() || 'XXXX'}-${user.email?.slice(0, 3).toUpperCase() || 'USR'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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
    // In production, this would generate a proper PDF or image
    // For now, we'll use the browser's print functionality
    console.log('Downloading badge...');
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
        {/* Badge Card */}
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

                {/* Badge Type (could be dynamic based on ticket type) */}
                <div className="mt-4 mb-6">
                  <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                    ATTENDEE
                  </span>
                </div>

                {/* QR Code Placeholder */}
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-xs text-gray-400 mt-1">QR Code</p>
                    </div>
                  </div>
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

        {/* Action Buttons */}
        <div className="mt-8 space-y-3 print:hidden">
          <Button
            onClick={handleDownload}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
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

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>Present this badge at the event for check-in</p>
          <p className="mt-1">Badge code can be used for quick verification</p>
        </div>
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
