import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Download, QrCode } from "lucide-react";

interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  type: string;
  image: string;
  registrationDate: string;
}

interface User {
  name: string;
  email: string;
  initials: string;
}

interface Registration {
  ticketId?: string;
  status?: string;
}

interface DashboardMyBadgeProps {
  eventData: EventData;
  user: User;
  registration?: Registration;
}

const DashboardMyBadge: React.FC<DashboardMyBadgeProps> = ({ eventData, user }) => {
  // Generate placeholder data
  const badgeData = {
    eventName: eventData.title || "Tech Conference 2024",
    attendeeName: user.name || "John Doe",
    company: "Dukapaq Ltd.",
    qrCode: "QR123456789",
    alternativeCode: "ALT789456123"
  };

  const handleDownload = () => {
    // Placeholder for download functionality
    console.log("Downloading badge...");
    // In a real implementation, this would generate and download a PDF or image
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          {/* Badge Card */}
          <Card className="w-full max-w-md mx-auto mb-8 shadow-2xl border-2 border-primary/20">
            <CardContent className="p-0">
              {/* Badge Header */}
              <div className="bg-white border-b border-gray-200 p-4 rounded-t-xl">
                <h2 className="text-lg font-bold text-center text-gray-900">{badgeData.eventName}</h2>
                <p className="text-sm text-center text-gray-600 mt-1">{eventData.date}</p>
              </div>
              
              {/* Badge Content */}
              <div className="p-8 bg-white">
                {/* Attendee Info */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-gray-700">{user.initials}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{badgeData.attendeeName}</h3>
                  <p className="text-base text-gray-600">{badgeData.company}</p>
                </div>

                {/* QR Code Section */}
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-gray-400" />
                  </div>
                </div>

                {/* Alternative Code Section */}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-600 mb-2">Alternative Code</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{badgeData.alternativeCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Button */}
          <Button 
            onClick={handleDownload}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Badge
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardMyBadge;

