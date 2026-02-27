import { CheckCircle2, Ticket, Download, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// App Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface TicketType {
  name: string;
  quantity: number;
  price: number;
}

interface ConfirmationData {
  eventId: string;
  eventTitle: string;
  tickets: TicketType[];
  totalPrice: number;
  paymentMethod: string;
  paymentId: string;
  date: string;
  isNewUser?: boolean;
}

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    eventTitle,
    tickets,
    totalPrice,
    paymentMethod,
    paymentId,
    date,
    isNewUser
  } = location.state as ConfirmationData;

  const handleDownloadTickets = () => {
    // In a real app, this would generate and download tickets
    alert('Downloading your tickets...');
  };

  const handleBackToEvent = () => {
    navigate(-2); // Go back to event details
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Increased top padding and added safety margin */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 pb-16">
        <div className="text-center mb-8 mt-32">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Order #{paymentId} • {new Date(date).toLocaleDateString()}
          </p>
          <div className="mt-4 p-4 bg-primary/5 border border-blue-200 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-blue-900">
              <strong>Check your email!</strong> Your ticket confirmation with QR code has been sent to your registered email address.
            </p>
          </div>
          {isNewUser && (
            <div className="mt-3 p-4 bg-success/10 border border-success/30 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-success">
                <strong>Your account has been created.</strong> Set a password in your profile to manage tickets faster next time.
              </p>
            </div>
          )}
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-medium mb-4">{eventTitle}</h3>
            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-primary" />
                    <div>
                      <p>{ticket.quantity}x {ticket.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${ticket.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">
                    ${(ticket.price * ticket.quantity).toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="pt-2 space-y-2">
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleDownloadTickets}
            className="gap-2"
            size="lg"
          >
            <Download className="w-5 h-5" />
            Download Tickets
          </Button>
          <Button
            variant="outline"
            onClick={handleBackToEvent}
            className="gap-2 hover:border-primary hover:bg-primary/5 transition-all duration-200"
            size="lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Event
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Confirmation;