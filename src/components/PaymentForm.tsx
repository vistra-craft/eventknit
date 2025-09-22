import { useState } from "react";
import { CreditCard, Lock, Loader2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Types
interface TicketType {
  name: string;
  quantity: number;
  price: number;
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
  event: {
    id: string;
    title: string;
  };
  tickets: TicketType[];
  totalPrice: number;
  onSuccess: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  totalPrice,
  onSuccess,
  onBack,
  onCancel
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  
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
    
    // Skip all validation and go directly to success
    // Simulate a quick loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Call the onSuccess callback
    onSuccess();
  };


  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Payment Method Selection */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credit/Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  PayPal
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Card Details */}
        {paymentMethod === 'card' && (
          <Card variant="default">
            <CardHeader>
              <CardTitle>Card Information</CardTitle>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      handleCardInputChange("cvv", e.target.value)
                    }
                    className="h-10"
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
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Address */}
        <Card variant="default">
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main Street"
                value={billingDetails.address}
                onChange={(e) =>
                  handleBillingInputChange("address", e.target.value)
                }
                className="h-10"
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
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="px-8 py-3 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
