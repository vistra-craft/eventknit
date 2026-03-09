import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { CalendarDays, DollarSign, BarChart2, PartyPopper } from 'lucide-react';

interface OrganizerOnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    Icon: PartyPopper,
    title: "You're now an organizer",
    description:
      "Your first event was approved. You now have access to all organizer tools — tickets, analytics, payouts, and more.",
  },
  {
    Icon: CalendarDays,
    title: 'Create events your way',
    description:
      'Set up event pages, choose ticket types, control capacity, and publish whenever you're ready.',
  },
  {
    Icon: DollarSign,
    title: 'Keep tabs on revenue',
    description:
      'See ticket sales as they come in, track earnings by tier, and request payouts from your Finance tab.',
  },
  {
    Icon: BarChart2,
    title: 'Know your audience',
    description:
      'Check-in rates, registration trends, attendee breakdown — it's all in Analytics once your event goes live.',
  },
] as const;

const OrganizerOnboardingModal = ({ open, onComplete }: OrganizerOnboardingModalProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];
  const { Icon } = current;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
      navigate('/organizer/dashboard');
    } else {
      setStep((s) => s + 1);
    }
  }, [isLastStep, onComplete, navigate]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md border-0 bg-transparent shadow-none p-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Welcome to Your Organizer Dashboard</DialogTitle>
        <DialogDescription className="sr-only">
          Learn about your new organizer features before entering the dashboard.
        </DialogDescription>

        <div className="rounded-xl bg-card border border-border shadow-xl">
          <div className="px-7 pt-8 pb-7">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-7">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-200 ${
                    i === step
                      ? 'w-5 h-1.5 bg-primary'
                      : i < step
                        ? 'w-1.5 h-1.5 bg-primary/30'
                        : 'w-1.5 h-1.5 bg-muted-foreground/20'
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
              <Icon className="w-5 h-5 text-primary" />
            </div>

            {/* Content */}
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {current.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-7">
              {current.description}
            </p>

            {/* Action button */}
            <Button
              size="default"
              variant="outline"
              className="w-full border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              onClick={handleNext}
            >
              {isLastStep ? 'Go to dashboard' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizerOnboardingModal;
