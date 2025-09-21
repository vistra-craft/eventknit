import { useState, useEffect } from "react";
import { CreditCard, Lock, ArrowLeft, Loader2, Ticket } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Types
interface TicketType {
  name: string;
  quantity: number;
  price: number;
}

interface PaymentData {
  eventId: string;
  eventTitle: string;
  tickets: TicketType[];
  totalPrice: number;
}

interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface BillingDetails {
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

interface PaymentFormProps {
  event?: {
    id: string;
    title: string;
  };
  id?: string;
  title?: string;
  tickets?: TicketType[];
  totalPrice?: number;
  onSuccess?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

interface LocationState {
  eventId?: string;
  eventTitle?: string;
  tickets?: TicketType[];
  totalPrice?: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  event: propEvent, 
  tickets: propTickets, 
  totalPrice: propTotalPrice,
  onSuccess: propOnSuccess,
  onBack: propOnBack,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  
  const locationState = location.state as LocationState | undefined;
  
  // Use props if provided, otherwise use location state
  const event = propEvent || (locationState?.eventId ? {
    id: locationState.eventId,
    title: locationState.eventTitle || ''
  } : undefined);
  
  const totalPrice = propTotalPrice !== undefined ? propTotalPrice : (locationState?.totalPrice || 0);
  const onSuccess = propOnSuccess || (() => navigate(`/event/${event?.id}/confirmation`, { state: locationState }));
  const onBack = propOnBack || (() => navigate(-1));

  // Set payment data from props or location state
  const [paymentData] = useState<PaymentData | null>(() => {
    if (locationState) {
      return {
        eventId: locationState.eventId || '',
        eventTitle: locationState.eventTitle || '',
        tickets: locationState.tickets || [],
        totalPrice: locationState.totalPrice || 0
      };
    }
    if (event && propTickets && propTotalPrice !== undefined) {
      return {
        eventId: event.id,
        eventTitle: event.title,
        tickets: propTickets,
        totalPrice: propTotalPrice
      };
    }
    return null;
  });

  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    address: "",
    city: "",
    zipCode: "",
    country: "United States",
  });

  // Handle initial data load and navigation
  useEffect(() => {
    if (!paymentData && !locationState) {
      // If no payment data and no location state, redirect back
      navigate('/');
    }
  }, [locationState, navigate, paymentData]);

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const { eventId, eventTitle, tickets: paymentTickets } = paymentData;
  const subtotal = paymentTickets.reduce((sum: number, ticket: TicketType) => sum + (ticket.price * ticket.quantity), 0);
  const tax = totalPrice - subtotal;

  const handleCardInputChange = (field: keyof CardDetails, value: string) => {
    let formattedValue = value;
    
    // Format card number with spaces
    if (field === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    // Format expiry date
    else if (field === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(?=\d{2})/, '$1/').slice(0, 5);
    }
    // Format CVV
    else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleBillingInputChange = (field: keyof BillingDetails, value: string) => {
    setBillingDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate card details if paying by card
      if (paymentMethod === 'card') {
        if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName) {
          throw new Error('Please fill in all card details');
        }

        // Basic card validation
        const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
        if (cardNumber.length < 15 || cardNumber.length > 19) {
          throw new Error('Please enter a valid card number');
        }

        // Basic expiry date validation (MM/YY format)
        const [month, year] = cardDetails.expiryDate.split('/');
        if (!month || !year || month.length !== 2 || year.length !== 2) {
          throw new Error('Please enter a valid expiry date (MM/YY)');
        }

        // Validate expiry date is not in the past
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        const expMonth = parseInt(month, 10);
        const expYear = parseInt(year, 10);

        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          throw new Error('Card has expired');
        }

        if (expMonth < 1 || expMonth > 12) {
          throw new Error('Please enter a valid month (01-12)');
        }
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call onSuccess callback or navigate to confirmation page
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/event/${eventId}/confirmation`, {
          state: {
            eventId,
            eventTitle,
            tickets: paymentTickets,
            totalPrice,
            paymentMethod,
            paymentId: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            date: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Complete Your Purchase</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Order Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium">{eventTitle}</h3>
            
            {paymentTickets.map((ticket, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-muted-foreground" />
                  <span>{ticket.quantity}x {ticket.name}</span>
                </div>
                <span>${(ticket.price * ticket.quantity).toFixed(2)}</span>
              </div>
            ))}
            
            <div className="pt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fees & Taxes</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={setPaymentMethod}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="card" id="card" />
                <Label
                  htmlFor="card"
                  className="flex-1 flex items-center cursor-pointer"
                >
                  <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Credit/Debit Card</div>
                    <p className="text-sm text-muted-foreground">Pay with your credit or debit card</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                  <div className="font-medium">PayPal</div>
                  <p className="text-sm text-muted-foreground">Pay with your PayPal account</p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Card Payment Form */}
        {paymentMethod === "card" && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                Card Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChange={(e) =>
                    handleCardInputChange("cardNumber", e.target.value)
                  }
                  className="h-10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChange={(e) =>
                      handleCardInputChange("expiryDate", e.target.value)
                    }
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => handleCardInputChange("cvv", e.target.value)}
                    className="h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  value={cardDetails.cardholderName}
                  onChange={(e) =>
                    handleCardInputChange("cardholderName", e.target.value)
                  }
                  className="h-10"
                  required
                />
              </div>

              {/* Billing Address */}
              <Separator className="my-4" />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Billing Address</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St"
                      value={billingDetails.address}
                      onChange={(e) =>
                        handleBillingInputChange("address", e.target.value)
                      }
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        value={billingDetails.city}
                        onChange={(e) =>
                          handleBillingInputChange("city", e.target.value)
                        }
                        className="h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="10001"
                        value={billingDetails.zipCode}
                        onChange={(e) =>
                          handleBillingInputChange("zipCode", e.target.value)
                        }
                        className="h-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <select
                      id="country"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={billingDetails.country}
                      onChange={(e) =>
                        handleBillingInputChange("country", e.target.value)
                      }
                      required
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PayPal Option */}
        {paymentMethod === "paypal" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  You will be redirected to PayPal to complete your payment
                  securely.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Amount to be charged: <strong>${totalPrice.toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-sm text-gray-600">
            <Lock className="h-4 w-4 mr-2" />
            Your payment information is encrypted and secure. We never store your
            card details.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${totalPrice.toFixed(2)}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;