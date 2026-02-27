import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Calendar, TrendingUp, BarChart3, ArrowRight, ChevronRight } from 'lucide-react';

interface OrganizerOnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    Icon: Sparkles,
    iconColor: 'text-primary',
    iconBg: 'from-primary/20 to-emerald-500/20',
    ringColor: 'ring-primary/10',
    title: "You're an Organizer Now!",
    description:
      "Your event has been approved and you've unlocked the full organizer experience. Here's a quick look at what's waiting for you.",
  },
  {
    Icon: Calendar,
    iconColor: 'text-blue-500',
    iconBg: 'from-blue-500/20 to-cyan-500/20',
    ringColor: 'ring-blue-500/10',
    title: 'Create & Manage Events',
    description:
      'Build professional event pages, set ticket tiers, manage capacity, and publish to your audience with just a few clicks.',
  },
  {
    Icon: TrendingUp,
    iconColor: 'text-emerald-500',
    iconBg: 'from-emerald-500/20 to-green-500/20',
    ringColor: 'ring-emerald-500/10',
    title: 'Track Your Revenue',
    description:
      'Monitor ticket sales in real time, view earnings breakdowns, and manage payouts — all from your organizer dashboard.',
  },
  {
    Icon: BarChart3,
    iconColor: 'text-violet-500',
    iconBg: 'from-violet-500/20 to-purple-500/20',
    ringColor: 'ring-violet-500/10',
    title: 'Analytics & Insights',
    description:
      'Understand your audience with rich analytics — attendee demographics, check-in rates, revenue trends, and more.',
  },
] as const;

const OrganizerOnboardingModal = ({ open, onComplete }: OrganizerOnboardingModalProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  // Reset to first step each time the modal opens
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
        className="sm:max-w-lg border-0 bg-transparent shadow-none p-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Welcome to Your Organizer Dashboard</DialogTitle>
        <DialogDescription className="sr-only">
          Learn about your new organizer features before entering the dashboard.
        </DialogDescription>

        <div className="relative overflow-hidden rounded-2xl bg-card border border-border/40 shadow-2xl">
          {/* Top gradient bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-primary" />

          {/* Animated glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl animate-pulse" />

          <div className="relative px-8 pt-10 pb-8 text-center">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-6 h-2 bg-primary'
                      : i < step
                        ? 'w-2 h-2 bg-primary/40'
                        : 'w-2 h-2 bg-muted-foreground/20'
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div
              className={`mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br ${current.iconBg} flex items-center justify-center ring-4 ${current.ringColor} transition-all duration-300`}
            >
              <Icon className={`w-9 h-9 ${current.iconColor}`} />
            </div>

            {/* Content */}
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
              {current.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto mb-8">
              {current.description}
            </p>

            {/* Step counter */}
            <p className="text-xs text-muted-foreground/60 mb-4">
              {step + 1} of {STEPS.length}
            </p>

            {/* Action button */}
            <Button
              size="lg"
              className="w-full gap-2 text-base font-semibold h-12 rounded-xl"
              onClick={handleNext}
            >
              {isLastStep ? (
                <>
                  Enter Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizerOnboardingModal;
