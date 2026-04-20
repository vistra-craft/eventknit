import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { CreditCard, Shield, AlertCircle, Smartphone } from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { EventData } from '@/types/event';
import type { TicketSelection, PromoDiscount } from '../UnifiedRegistrationModal';
import { registerForEvent } from '@/lib/event-api';
import { initializePayment, initializeGuestPayment, verifyPayment } from '@/lib/payment-api';
import { useAuth } from '@/hooks/useAuth';
import { extractErrorMessage } from '@/lib/utils/error';

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
  registrationId?: string;
  [key: string]: unknown;
}

interface PaymentStepProps {
  event: EventData;
  selectedTickets: TicketSelection;
  totalPrice: number;
  registrationData: RegistrationData;
  onBack: () => void;
  onContinue: (data: PaymentResult) => void;
  promoDiscount?: PromoDiscount | null;
  selectedSeatIds?: string[];
}

// Paystack popup handler type
declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

export const PaymentStep = ({
  event,
  selectedTickets,
  totalPrice,
  registrationData,
  onBack,
  onContinue,
  promoDiscount,
  selectedSeatIds,
}: PaymentStepProps) => {
  const { isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mpesa'>('card');
  // Pre-populate if guest checkout already created the registration
  const [registrationId, setRegistrationId] = useState<string | null>(
    (registrationData.registrationId as string) || null
  );
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  const currency = event.currency || 'NGN';

  // Load Paystack script
  useEffect(() => {
    if (document.getElementById('paystack-script')) {
      setPaystackLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'paystack-script';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    script.onerror = () => setError('Unable to load the payment processor. Please refresh the page and try again.');
    document.body.appendChild(script);

    return () => {
      // Cleanup not needed as script should persist
    };
  }, []);

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

  const subtotal = ticketBreakdown.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = promoDiscount?.discountAmount || 0;

  // Create registration first
  const createRegistration = useCallback(async () => {
    try {
      // Convert selectedTickets to array format
      const tickets = Object.entries(selectedTickets)
        .filter(([, qty]) => qty > 0)
        .map(([ticketType, quantity]) => ({ ticketType, quantity }));

      const response = await registerForEvent(event.id, {
        tickets,
        registrationData: registrationData.registrationData,
        ...(promoDiscount?.code ? { promoCode: promoDiscount.code } : {}),
        ...(selectedSeatIds?.length ? { seatIds: selectedSeatIds } : {}),
      });

      if (response.success && response.data?.registration?.id) {
        return response.data.registration.id;
      }
      throw new Error(response.message || 'We couldn\'t complete your registration. Please try again.');
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Registration failed. Please try again.'));
    }
  }, [event.id, selectedTickets, registrationData, promoDiscount?.code, selectedSeatIds]);

  // Handle Paystack popup payment
  const handlePaystackPayment = useCallback(async (regId: string) => {
    if (!window.PaystackPop) {
      setError('Payment processor is still loading. Please wait a moment and try again.');
      setIsProcessing(false);
      return;
    }

    try {
      // Initialize payment on backend — try authenticated endpoint, fall back to guest
      let initResponse;
      if (isAuthenticated) {
        initResponse = await initializePayment(regId);
      } else {
        const email = registrationData.email as string;
        initResponse = await initializeGuestPayment(regId, email);
      }

      if (!initResponse.success) {
        throw new Error(initResponse.message || 'Unable to start the payment process. Please try again.');
      }

      const { authorizationUrl, reference } = initResponse.data;

      // If we have a public key, use popup; otherwise redirect
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

      if (publicKey && window.PaystackPop) {
        // Use Paystack inline popup
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: registrationData.email || '',
          amount: Math.round(totalPrice * 100), // Convert to kobo/cents
          currency: currency,
          ref: reference,
          callback: async (response) => {
            // Verify payment
            try {
              const verifyResponse = await verifyPayment(response.reference);
              if (verifyResponse.success && verifyResponse.data.success) {
                onContinue({
                  method: 'paystack',
                  transactionId: response.reference,
                  amount: totalPrice,
                  currency: currency,
                  status: 'success',
                  registrationId: regId,
                });
              } else {
                setError('We couldn\'t verify your payment. If you were charged, please contact support with your transaction reference.');
                setIsProcessing(false);
              }
            } catch {
              // Payment might still have succeeded - webhook will handle it
              onContinue({
                method: 'paystack',
                transactionId: response.reference,
                amount: totalPrice,
                currency: currency,
                status: 'pending',
                registrationId: regId,
              });
            }
          },
          onClose: () => {
            setError('Payment was cancelled. Don\'t worry — your registration is saved. Click "Pay" when you\'re ready to try again.');
            setIsProcessing(false);
          },
        });

        handler.openIframe();
      } else if (authorizationUrl) {
        // Fallback: redirect to Paystack checkout page
        window.location.href = authorizationUrl;
      } else {
        throw new Error('No payment method available');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to start the payment process. Please check your connection and try again.'));
      setIsProcessing(false);
    }
  }, [registrationData.email, totalPrice, currency, onContinue, isAuthenticated]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Guard: Prevent payment for free events
      if (event.isFree || totalPrice === 0) {
        setError('This is a free event — no payment needed! If you\'re seeing this by mistake, please contact support.');
        setIsProcessing(false);
        return;
      }

      // Step 1: Create registration if not already created
      let regId = registrationId;
      if (!regId) {
        regId = await createRegistration();
        setRegistrationId(regId);
      }

      if (paymentMethod === 'card') {
        // Step 2: Initialize and process Paystack payment
        if (!regId) {
          setError('Something went wrong setting up your registration. Please go back and try again.');
          setIsProcessing(false);
          return;
        }
        await handlePaystackPayment(regId);
      } else if (paymentMethod === 'mpesa') {
        // M-Pesa is handled via SMS/USSD flow
        setError('M-Pesa payment is currently only available via SMS registration. Please use card payment instead.');
        setIsProcessing(false);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Payment failed. Please check your connection and try again.'));
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-section-header mb-2">Payment</h3>
        <p className="text-card-description">
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
        <h4 className="text-card-title mb-3">Order Summary</h4>
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
          {promoDiscount && discountAmount > 0 && (
            <>
              <div className="border-t pt-2 mt-2 flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{currency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-success">
                <span>Discount ({promoDiscount.code})</span>
                <span>-{currency} {discountAmount.toFixed(2)}</span>
              </div>
            </>
          )}
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
          <h4 className="text-card-title mb-3 flex items-center gap-2">
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

      {/* Payment Method Selection */}
      <Card className="p-4">
        <h4 className="text-card-title mb-3">Payment Method</h4>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as 'card' | 'mpesa')}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
              <CreditCard className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Card Payment</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, Verve</p>
              </div>
            </Label>
            <img
              src="/paystack-logo.png"
              alt="Paystack"
              className="h-5"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {currency === 'KES' && (
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer opacity-60">
              <RadioGroupItem value="mpesa" id="mpesa" />
              <Label htmlFor="mpesa" className="flex items-center gap-3 cursor-pointer flex-1">
                <Smartphone className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium">M-Pesa</p>
                  <p className="text-xs text-muted-foreground">Available via SMS registration</p>
                </div>
              </Label>
            </div>
          )}
        </RadioGroup>
      </Card>

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-success/5 p-3 rounded-lg border border-success">
        <Shield className="w-4 h-4 text-success flex-shrink-0" />
        <span>256-bit SSL encryption. Your payment information is secure.</span>
      </div>

      {/* Refund Policy */}
      <Alert>
        <AlertDescription className="text-xs">
          By completing this purchase, you agree to our{' '}
          <Link to="/terms-of-service#refund-policy" className="text-primary hover:underline">
            refund policy
          </Link>
          . Refunds are available up to 48 hours before the event.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handlePayment}
          disabled={isProcessing || (!paystackLoaded && paymentMethod === 'card')}
        >
          {isProcessing ? (
            <>
              <Loader size="sm" className="mr-2" />
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
