import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check } from 'lucide-react';
import { TicketSelectionStep } from './registration-steps/TicketSelectionStep';
import { RegistrationStep } from './registration-steps/RegistrationStep';
import { PaymentStep } from './registration-steps/PaymentStep';
import { ConfirmationStep } from './registration-steps/ConfirmationStep';
import { SeatSelectionStep } from './registration-steps/SeatSelectionStep';
import type { EventData } from '@/types/event';

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

interface RegistrationData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  registrationData?: Record<string, string | boolean>;
  [key: string]: unknown;
}

interface PaymentData {
  method: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
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

  const handleRegistrationComplete = (data: RegistrationData) => {
    setRegistrationData(data);
    if (event.isFree) {
      // For free events, skip payment and go directly to confirmation
      handlePaymentComplete({ method: 'free' });
    } else {
      setCurrentStep('payment');
    }
  };

  const handlePaymentComplete = (data: PaymentData) => {
    setPaymentData(data);
    setCurrentStep('confirmation');
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleClose = () => {
    if (currentStep === 'confirmation') {
      // Allow closing after confirmation
      onClose();
      // Reset state
      setTimeout(() => {
        setCurrentStep(shouldSkipTicketSelection ? (hasSeatMap ? 'seats' : 'registration') : 'tickets');
        setSelectedTickets({});
        setRegistrationData(null);
        setPaymentData(null);
        setPromoDiscount(null);
        setSelectedSeatIds([]);
        setSeatTotalPrice(0);
      }, 300);
    } else {
      // Confirm before closing if in middle of process
      if (confirm('Are you sure you want to cancel your registration?')) {
        onClose();
      }
    }
  };

  const subtotal = event.ticketTypes?.reduce(
    (sum, ticket) => sum + (ticket.price || 0) * (selectedTickets[ticket.name] || 0),
    0
  ) || 0;
  const totalPrice = Math.max(0, subtotal + seatTotalPrice - (promoDiscount?.discountAmount || 0));
  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <RegistrationStep
              event={event}
              selectedTickets={selectedTickets}
              totalPrice={totalPrice}
              totalTickets={totalTickets}
              onContinue={handleRegistrationComplete}
            />
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
        </div>

        {/* Back Button (except on confirmation) */}
        {currentStep !== 'confirmation' && currentStepIndex > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
