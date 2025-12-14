import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Ticket, Calendar, MapPin, AlertCircle, Lock } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// App Components
import PublicLayout from "@/components/PublicLayout";

// API
import { initializePayment, verifyPayment } from "@/lib/payment-api";

// Types
interface TicketType {
  name: string;
  quantity: number;
  price: number;
}

interface PaymentData {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  tickets: TicketType[];
  totalPrice: number;
}


const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  
  // Get payment data from location state
  const paymentData = location.state as PaymentData | undefined;
  
  // Check if this is a payment callback (from Paystack redirect)
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  // Handle payment callback from Paystack
  useEffect(() => {
    const handlePaymentCallback = async () => {
      const paymentRef = reference || trxref;
      if (paymentRef && paymentData) {
        setLoading(true);
        try {
          const verification = await verifyPayment(paymentRef);
          if (verification.success && verification.data.success) {
            // Payment successful - redirect to confirmation
            navigate(`/event/${paymentData.eventId}/registration-confirmation`, {
              state: {
                eventId: paymentData.eventId,
                eventTitle: paymentData.eventTitle,
                tickets: paymentData.tickets,
                totalPrice: paymentData.totalPrice,
                paymentMethod: 'paystack',
                paymentId: paymentRef,
                date: new Date().toISOString(),
                isFreeEvent: false,
                success: true,
              }
            });
          } else {
            // Payment failed
            setError('Payment verification failed. Please try again or contact support.');
          }
        } catch (err: unknown) {
          const errorMessage = err && typeof err === 'object' && 'message' in err
            ? (err.message as string)
            : 'Failed to verify payment. Please contact support.';
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      }
    };

    if (reference || trxref) {
      handlePaymentCallback();
    }
  }, [reference, trxref, paymentData, navigate]);

  // Auto-initialize payment and redirect to Paystack when page loads
  useEffect(() => {
    const autoInitializePayment = async () => {
      // Skip if this is a callback (reference exists), no payment data, or already initialized
      if (reference || trxref || !paymentData?.registrationId || hasInitialized) {
        return;
      }

      setHasInitialized(true);
      setInitializing(true);
      setError(null);

      try {
        // Initialize Paystack payment
        const response = await initializePayment(paymentData.registrationId);

        if (response.success && response.data?.authorizationUrl) {
          // Immediately redirect to Paystack checkout
          window.location.href = response.data.authorizationUrl;
        } else {
          throw new Error(response.message || 'Failed to initialize payment');
        }
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to initialize payment. Please try again.';
        setError(errorMessage);
        setInitializing(false);
        setHasInitialized(false); // Allow retry
      }
    };

    autoInitializePayment();
  }, [paymentData, reference, trxref, hasInitialized]);

  // Show loading state if initializing payment or if no payment data
  if (!paymentData || initializing) {
    return (
      <PublicLayout>
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {initializing ? 'Redirecting to secure payment...' : 'Loading payment...'}
          </p>
        </div>
      </PublicLayout>
    );
  }

  const { eventTitle, tickets: paymentTickets } = paymentData;
  const subtotal = paymentTickets.reduce((sum: number, ticket: TicketType) => sum + (ticket.price * ticket.quantity), 0);
  const tax = paymentData.totalPrice - subtotal;

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Progress Indicators */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <span className="ml-2 text-sm font-medium">Registration</span>
            </div>
            <div className="w-8 h-0.5 bg-primary"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <span className="ml-2 text-sm font-medium">Payment</span>
            </div>
            <div className="w-8 h-0.5 bg-muted"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <span className="ml-2 text-sm font-medium text-muted-foreground">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Navigation Header */}
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(`/event/${paymentData.eventId}/register`)}
            className="hover:border-primary hover:bg-primary/5 transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Complete Your Purchase</h1>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            <div className="mt-4">
              <Button
                onClick={() => {
                  setError(null);
                  setInitializing(true);
                  initializePayment(paymentData.registrationId)
                    .then((response) => {
                      if (response.success && response.data?.authorizationUrl) {
                        window.location.href = response.data.authorizationUrl;
                      } else {
                        throw new Error(response.message || 'Failed to initialize payment');
                      }
                    })
                    .catch((err: unknown) => {
                      const errorMessage = err && typeof err === 'object' && 'message' in err
                        ? (err.message as string)
                        : 'Failed to initialize payment. Please try again.';
                      setError(errorMessage);
                      setInitializing(false);
                    });
                }}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Info - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {!error && (
              <Card variant="default">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold">Redirecting to Secure Payment</h3>
                      <p className="text-muted-foreground">
                        You will be redirected to Paystack's secure payment page to complete your purchase.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <Card variant="default" className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Event Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{eventTitle}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Dec 15, 2024</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>New York, NY</span>
                  </div>
                </div>

                <Separator />

                {/* Ticket Details */}
                <div className="space-y-3">
                  {paymentTickets.map((ticket, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{ticket.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {ticket.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(ticket.price * ticket.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${paymentData.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-muted rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Secure payment processing</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PaymentPage;