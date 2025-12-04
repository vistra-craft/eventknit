import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Loader2, CreditCard, Shield, AlertCircle } from 'lucide-react';
import type { EventData } from '@/types/event';
import type { TicketSelection } from '../UnifiedRegistrationModal';

interface RegistrationData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  registrationData?: Record<string, string | boolean>;
  [key: string]: unknown;
}

interface PaymentResult {
  method: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}

interface PaymentStepProps {
  event: EventData;
  selectedTickets: TicketSelection;
  totalPrice: number;
  registrationData: RegistrationData;
  onBack: () => void;
  onContinue: (data: PaymentResult) => void;
}

export const PaymentStep = ({
  event,
  selectedTickets,
  totalPrice,
  registrationData,
  onBack,
  onContinue,
}: PaymentStepProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = event.currency || 'USD';

  // Calculate breakdown
  const ticketBreakdown = Object.entries(selectedTickets)
    .filter(([, qty]) => qty > 0)
    .map(([name, qty]) => {
      const ticket = event.ticketTypes?.find((t) => t.name === name);
      return {
        name,
        quantity: qty,
        price: ticket?.price || 0,
        subtotal: (ticket?.price || 0) * qty,
      };
    });

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Integrate with Paystack
      // For now, simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Proceed to confirmation
      onContinue({
        method: 'paystack',
        transactionId: `TXN-${Date.now()}`,
        amount: totalPrice,
        currency: currency,
        status: 'success',
      });
    } catch {
      setError('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment</h3>
        <p className="text-sm text-muted-foreground">
          Review your order and complete payment
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Order Summary */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Order Summary</h4>
        <div className="space-y-2">
          {ticketBreakdown.map((item) => (
            <div key={item.name} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.name} x {item.quantity}
              </span>
              <span className="font-medium">
                {currency} {item.subtotal.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary text-lg">
              {currency} {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Billing Information */}
      {registrationData && (
        <Card className="p-4 bg-muted/30">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Billing Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span>
                {registrationData.firstName || ''} {registrationData.lastName || ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{registrationData.email || ''}</span>
            </div>
            {registrationData.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span>{registrationData.phoneNumber}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Payment Method */}
      <Card className="p-4 border-2 border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Method
          </h4>
          <img
            src="/paystack-logo.png"
            alt="Paystack"
            className="h-6"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Secure payment processing powered by Paystack. You'll be redirected to complete your
          payment.
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-green-600" />
          <span>256-bit SSL encryption. Your payment information is secure.</span>
        </div>
      </Card>

      {/* Refund Policy */}
      <Alert>
        <AlertDescription className="text-xs">
          By completing this purchase, you agree to our{' '}
          <a href="/terms-of-service#refund-policy" className="text-primary hover:underline">
            refund policy
          </a>
          . Refunds are available up to 48 hours before the event.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        <Button size="lg" className="flex-1" onClick={handlePayment} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {currency} {totalPrice.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

