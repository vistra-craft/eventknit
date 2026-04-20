import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { TicketSelectionStep } from './registration-steps/TicketSelectionStep';
import { RegistrationStep } from './registration-steps/RegistrationStep';
import type { RegistrationData } from './registration-steps/RegistrationStep';
import { PaymentStep } from './registration-steps/PaymentStep';
import { ConfirmationStep } from './registration-steps/ConfirmationStep';
import { SeatSelectionStep } from './registration-steps/SeatSelectionStep';
import type { EventData } from '@/types/event';
import { registerForEvent } from '@/lib/event-api';
import { extractErrorMessage } from '@/lib/utils/error';

export interface TicketSelection {
  [ticketName: string]: number;
}

export interface PromoDiscount {
  code: string;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
}

interface UnifiedRegistrationModalProps {
  event: EventData;
  isOpen: boolean;
  onClose: () => void;
  userAlreadyRegistered?: boolean;
}

type Step = 'tickets' | 'seats' | 'registration' | 'payment' | 'confirmation';

interface PaymentData {
  method: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  registrationId?: string;
  [key: string]: unknown;
}

export const UnifiedRegistrationModal = ({
  event,
  isOpen,
  onClose,
}: UnifiedRegistrationModalProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('tickets');
  const [selectedTickets, setSelectedTickets] = useState<TicketSelection>({});
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<PromoDiscount | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [seatTotalPrice, setSeatTotalPrice] = useState(0);
  const [freeRegLoading, setFreeRegLoading] = useState(false);
  const [freeRegError, setFreeRegError] = useState<string | null>(null);
  const [cancelRegConfirm, setCancelRegConfirm] = useState(false);

  // Determine if we should skip ticket selection for free events or single ticket types
  const shouldSkipTicketSelection =
    event.isFree ||
    !event.ticketTypes ||
    event.ticketTypes.length === 0 ||
    (event.ticketTypes.length === 1 && event.isFree);

  const hasSeatMap = !!event.hasSeatMap;

  // Reset to appropriate step when modal opens
  useEffect(() => {
    if (isOpen) {
      if (shouldSkipTicketSelection) {
        setCurrentStep(hasSeatMap ? 'seats' : 'registration');
        // Auto-select single free ticket
        if (event.ticketTypes && event.ticketTypes.length === 1) {
          setSelectedTickets({ [event.ticketTypes[0].name]: 1 });
        }
      } else {
        setCurrentStep('tickets');
      }
    }
  }, [isOpen, shouldSkipTicketSelection, hasSeatMap, event.ticketTypes]);

  // Build steps array dynamically based on event configuration
  const steps: { key: Step; label: string; number: number }[] = (() => {
    const list: { key: Step; label: string }[] = [];
    if (!shouldSkipTicketSelection) list.push({ key: 'tickets', label: 'Tickets' });
    if (hasSeatMap) list.push({ key: 'seats', label: 'Seats' });
    list.push({ key: 'registration', label: 'Registration' });
    if (!event.isFree) list.push({ key: 'payment', label: 'Payment' });
    list.push({ key: 'confirmation', label: 'Confirmation' });
    return list.map((s, i) => ({ ...s, number: i + 1 }));
  })();

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleTicketSelectionComplete = (tickets: TicketSelection) => {
    setSelectedTickets(tickets);
    setCurrentStep(hasSeatMap ? 'seats' : 'registration');
  };

  const handleSeatSelectionComplete = (seatIds: string[], totalPrice: number) => {
    setSelectedSeatIds(seatIds);
    setSeatTotalPrice(totalPrice);
    setCurrentStep('registration');
  };

  const handleSeatSkip = () => {
    setSelectedSeatIds([]);
    setSeatTotalPrice(0);
    setCurrentStep('registration');
  };

  const handlePaymentComplete = (data: PaymentData) => {
    setPaymentData(data);
    setCurrentStep('confirmation');
  };

  const handleRegistrationComplete = async (data: RegistrationData) => {
    setRegistrationData(data);
    setFreeRegError(null);

    // Calculate total from selected tickets — if $0 (all free tiers), skip payment
    const selectedTotal = event.ticketTypes?.reduce(
      (sum, t) => sum + (t.price || 0) * (selectedTickets[t.name] || 0),
      0
    ) || 0;

    if (event.isFree || selectedTotal === 0) {
      // If guest checkout already created the registration, skip the API call
      if (data.registrationId) {
        handlePaymentComplete({ method: 'free', registrationId: data.registrationId });
        return;
      }

      // Authenticated user registering for a free event — create the registration now
      setFreeRegLoading(true);
      try {
        const tickets = Object.entries(selectedTickets)
          .filter(([, qty]) => qty > 0)
          .map(([ticketType, quantity]) => ({ ticketType, quantity }));

        // Ensure at least one ticket entry for free events with no explicit selection
        if (tickets.length === 0 && event.ticketTypes && event.ticketTypes.length > 0) {
          tickets.push({ ticketType: event.ticketTypes[0].name, quantity: 1 });
        }

        const response = await registerForEvent(event.id, {
          tickets: tickets.length > 0 ? tickets : undefined,
          registrationData: data.registrationData,
        });

        if (!response.success || !response.data?.registration?.id) {
          throw new Error(response.message || 'Registration failed');
        }

        const regId = response.data.registration.id;
        setRegistrationData({ ...data, registrationId: regId });
        handlePaymentComplete({ method: 'free', registrationId: regId });
      } catch (err) {
        setFreeRegError(extractErrorMessage(err, 'Registration failed. Please try again.'));
        setFreeRegLoading(false);
      }
    } else {
      setCurrentStep('payment');
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleClose = () => {
    if (currentStep === 'confirmation') {
      onClose();
      setTimeout(() => {
        setCurrentStep(shouldSkipTicketSelection ? (hasSeatMap ? 'seats' : 'registration') : 'tickets');
        setSelectedTickets({});
        setRegistrationData(null);
        setPaymentData(null);
        setPromoDiscount(null);
        setSelectedSeatIds([]);
        setSeatTotalPrice(0);
        setFreeRegError(null);
      }, 300);
    } else {
      setCancelRegConfirm(true);
    }
  };

  const subtotal = event.ticketTypes?.reduce(
    (sum, ticket) => sum + (ticket.price || 0) * (selectedTickets[ticket.name] || 0),
    0
  ) || 0;
  const totalPrice = Math.max(0, subtotal + seatTotalPrice - (promoDiscount?.discountAmount || 0));
  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-page-title">
            {currentStep === 'confirmation' ? 'Registration Complete!' : 'Complete Your Registration'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        {currentStep !== 'confirmation' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-1 ${
                    index <= currentStepIndex ? 'text-primary font-medium' : ''
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-xs">
                      {step.number}
                    </span>
                  )}
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mt-6">
          {currentStep === 'tickets' && (
            <TicketSelectionStep
              event={event}
              selectedTickets={selectedTickets}
              onTicketsChange={setSelectedTickets}
              onContinue={handleTicketSelectionComplete}
              promoDiscount={promoDiscount}
              onPromoChange={setPromoDiscount}
            />
          )}

          {currentStep === 'seats' && (
            <SeatSelectionStep
              event={event}
              totalTickets={Math.max(1, totalTickets)}
              onContinue={handleSeatSelectionComplete}
              onSkip={handleSeatSkip}
            />
          )}

          {currentStep === 'registration' && (
            <>
              {freeRegError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{freeRegError}</AlertDescription>
                </Alert>
              )}
              <RegistrationStep
                event={event}
                selectedTickets={selectedTickets}
                totalPrice={totalPrice}
                totalTickets={totalTickets}
                onContinue={handleRegistrationComplete}
              />
            </>
          )}

          {currentStep === 'payment' && registrationData && (
            <PaymentStep
              event={event}
              selectedTickets={selectedTickets}
              totalPrice={totalPrice}
              registrationData={registrationData}
              onBack={handleBack}
              onContinue={handlePaymentComplete}
              promoDiscount={promoDiscount}
              selectedSeatIds={selectedSeatIds}
            />
          )}

          {currentStep === 'confirmation' && registrationData && (
            <ConfirmationStep
              event={event}
              selectedTickets={selectedTickets}
              registrationData={registrationData}
              paymentData={paymentData}
              onClose={onClose}
            />
          )}

          {/* Free event loading overlay */}
          {freeRegLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Completing your registration…</p>
            </div>
          )}
        </div>

        {/* Back Button (except on confirmation) */}
        {currentStep !== 'confirmation' && currentStepIndex > 0 && !freeRegLoading && (
          <div className="mt-6 pt-4 border-t">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <AlertDialog open={cancelRegConfirm} onOpenChange={setCancelRegConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel registration?</AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to cancel your registration?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, continue</AlertDialogCancel>
          <AlertDialogAction onClick={() => { setCancelRegConfirm(false); onClose(); }}>Yes, cancel</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
