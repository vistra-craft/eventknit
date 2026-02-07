import { useState, useEffect } from "react";
import { Lock, Ticket, Calendar, MapPin, AlertCircle, CreditCard, CheckCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// App Components
import CheckoutHeader from "@/components/CheckoutHeader";

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
  eventDate?: string;
  eventLocation?: string;
  tickets: TicketType[];
  totalPrice: number;
  discount?: number;
  promoCode?: string;
}

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get payment data from location state
  const paymentData = location.state as PaymentData | undefined;

  // Check if this is a payment callback (from Paystack redirect)
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  // Handle payment callback from Paystack
  useEffect(() => {
    const handlePaymentCallback = async () => {
      const paymentRef = reference || trxref;
      if (paymentRef) {
        setVerifying(true);
        try {
          const verification = await verifyPayment(paymentRef);
          if (verification.success && verification.data.success) {
            // Payment successful - redirect to confirmation
            navigate(`/confirmation`, {
              state: {
                eventId: paymentData?.eventId,
                eventTitle: paymentData?.eventTitle,
                tickets: paymentData?.tickets,
                totalPrice: paymentData?.totalPrice,
                paymentMethod: 'paystack',
                paymentId: paymentRef,
                date: new Date().toISOString(),
                isFreeEvent: false,
                success: true,
              },
              replace: true
            });
          } else {
            setError('Payment verification failed. Please try again or contact support.');
          }
        } catch (err: unknown) {
          const errorMessage = err && typeof err === 'object' && 'message' in err
            ? (err.message as string)
            : 'Failed to verify payment. Please contact support.';
          setError(errorMessage);
        } finally {
          setVerifying(false);
        }
      }
    };

    if (reference || trxref) {
      handlePaymentCallback();
    }
  }, [reference, trxref, paymentData, navigate]);

  // Handle initial data load and navigation
  useEffect(() => {
    if (!paymentData && !reference && !trxref) {
      navigate('/');
    }
  }, [paymentData, reference, trxref, navigate]);

  // Show verifying state when returning from Paystack
  if (verifying || (reference || trxref)) {
    return (
      <div className="min-h-screen bg-background">
        <CheckoutHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader size="lg" />
          <p className="text-lg font-medium">Verifying your payment...</p>
          <p className="text-sm text-muted-foreground">Please wait while we confirm your transaction.</p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-background">
        <CheckoutHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  const { eventTitle, tickets: paymentTickets, eventDate, eventLocation } = paymentData;
  const subtotal = paymentTickets.reduce((sum: number, ticket: TicketType) => sum + (ticket.price * ticket.quantity), 0);
  const discount = paymentData.discount || 0;
  const serviceFee = paymentData.totalPrice - subtotal + discount;

  const handlePayWithPaystack = async () => {
    if (!paymentData?.registrationId) {
      setError('Registration ID is missing. Please go back and try again.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Initialize Paystack payment
      const response = await initializePayment(paymentData.registrationId);

      if (response.success && response.data?.authorizationUrl) {
        // Redirect to Paystack checkout
        window.location.href = response.data.authorizationUrl;
      } else {
        throw new Error(response.message || 'Failed to initialize payment');
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string)
        : 'Failed to initialize payment. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CheckoutHeader backLink={`/event/${paymentData.eventId}/register`} backLabel="Back to Registration" eventTitle={eventTitle} />

      <main className="flex-1 pt-6 pb-10 bg-gradient-to-b from-primary/5 via-background to-muted/10">
        <div className="max-w-4xl mx-auto px-4">
          {/* Progress Indicators */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  <CheckCircle className="w-5 h-5" />
                </div>
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

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-xl font-bold">Complete Your Purchase</h1>
            <p className="text-sm text-muted-foreground">Secure payment powered by Paystack</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Order Summary - Left Column */}
            <div className="lg:col-span-3">
              <Card className="border border-border bg-background rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Event Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">{eventTitle}</h3>
                    {eventDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{eventDate}</span>
                      </div>
                    )}
                    {eventLocation && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{eventLocation}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Ticket Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">TICKETS</h4>
                    {paymentTickets.map((ticket, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">{ticket.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.quantity} x KES {ticket.price.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold">
                          KES {(ticket.price * ticket.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Pricing Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>KES {subtotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Discount {paymentData.promoCode && `(${paymentData.promoCode})`}</span>
                        <span>-KES {discount.toLocaleString()}</span>
                      </div>
                    )}
                    {serviceFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Service Fee</span>
                        <span>KES {serviceFee.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>KES {paymentData.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Action - Right Column */}
            <div className="lg:col-span-2">
              <Card className="border-0 bg-card-surface rounded-2xl shadow-sm sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      You'll be redirected to Paystack to complete your payment securely.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      <span>256-bit SSL encrypted</span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayWithPaystack}
                    disabled={loading}
                    className="w-full py-6 text-lg font-semibold"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader className="mr-2" />
                        Redirecting to Paystack...
                      </>
                    ) : (
                      <>
                        Pay KES {paymentData.totalPrice.toLocaleString()}
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      By clicking Pay, you agree to our Terms of Service
                    </p>
                  </div>

                  {/* Payment Methods */}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center mb-3">Accepted payment methods</p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="px-3 py-1 bg-muted rounded text-xs font-medium">Visa</div>
                      <div className="px-3 py-1 bg-muted rounded text-xs font-medium">Mastercard</div>
                      <div className="px-3 py-1 bg-muted rounded text-xs font-medium">M-Pesa</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
