import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { DialogRoot, DialogPortal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';
import { EventPreferencesStep } from '@/components/onboarding/EventPreferencesStep';
import { useAuthContext } from '@/hooks/useAuthContext';

interface OrganizerSetupDialogProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1, label: 'Your profile' },
  { id: 2, label: "What's next" },
];

const HOW_IT_WORKS = [
  {
    number: '01',
    title: 'Create your first event',
    description: 'Set up your event details, pricing, and capacity.',
  },
  {
    number: '02',
    title: 'Quick team review',
    description: 'Our team reviews and approves it within 24-48 hours.',
  },
  {
    number: '03',
    title: 'Full dashboard access',
    description: 'After 3 approved events, publish instantly with no review.',
  },
];

export const OrganizerSetupDialog = ({ open, onClose }: OrganizerSetupDialogProps) => {
  const navigate = useNavigate();
  const { state: { user }, dispatch } = useAuthContext();

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    eventTypes: [] as string[],
    organizationType: '',
    eventsPerYear: '',
    isRecurringSeries: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setError('');
  };

  const handleNext = () => {
    if (formData.eventTypes.length === 0) { setError('Please select at least one event type'); return; }
    if (!formData.organizationType) { setError('Organization type is required'); return; }
    if (!formData.eventsPerYear) { setError('Please select how many events you plan to organize'); return; }
    setError('');
    setStep(2);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { completeOnboarding } = await import('@/lib/organizer-api');
      const response = await completeOnboarding(formData);
      if (response.success && user) {
        dispatch({ type: 'UPDATE_USER', payload: { ...user, onboardingCompleted: true } });
        onClose();
      } else {
        throw new Error(response.message || 'Failed to save preferences');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    await handleComplete();
    navigate('/organizer/events/create-standalone');
  };

  return (
    <DialogRoot open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogPortal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[480px] translate-x-[-50%] translate-y-[-50%] flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl max-h-[92vh] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] focus:outline-none">

          {/* Top accent line */}
          <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />

          {/* Close button */}
          <DialogPrimitive.Close className="absolute right-4 top-5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Scrollable body */}
          <div className="flex flex-col overflow-y-auto">

            {/* Header */}
            <div className="px-6 pt-6 pb-5 pr-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary/70 mb-2">
                Step {step} of {STEPS.length}
              </p>
              <h2 className="text-xl font-semibold text-foreground leading-snug">
                {step === 1
                  ? (user?.firstName ? `Welcome, ${user.firstName}` : 'Welcome aboard')
                  : "You're almost set"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 1
                  ? 'Help us tailor your EventKnit experience.'
                  : 'Here is how your first events will work.'}
              </p>

              {/* Stepper */}
              <div className="mt-5 flex items-center gap-0">
                {STEPS.map((s, i) => {
                  const isCompleted = s.id < step;
                  const isCurrent = s.id === step;
                  return (
                    <div key={s.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-primary'
                            : isCurrent
                            ? 'border-2 border-primary'
                            : 'border-2 border-border'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-primary' : ''}`} />
                          )}
                        </div>
                        <span className={`text-xs font-medium transition-colors duration-200 ${
                          isCurrent ? 'text-foreground' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'
                        }`}>
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 mx-3 h-px transition-colors duration-300 ${step > s.id ? 'bg-primary/50' : 'bg-border'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-border/50 mx-6 shrink-0" />

            {/* Content */}
            <div className="px-6 py-5">

              {step === 1 && (
                <EventPreferencesStep formData={formData} onUpdate={handleUpdate} error={error} showHeader={false} />
              )}

              {step === 2 && (
                <div className="space-y-5">
                  {/* Numbered timeline */}
                  <div>
                    {HOW_IT_WORKS.map((item, i) => (
                      <div key={item.number} className="flex gap-4">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 rounded-full border border-border bg-muted/40 flex items-center justify-center">
                            <span className="text-[11px] font-mono font-semibold text-muted-foreground">{item.number}</span>
                          </div>
                          {i < HOW_IT_WORKS.length - 1 && (
                            <div className="w-px flex-1 min-h-[24px] my-1.5" style={{ background: 'repeating-linear-gradient(to bottom, hsl(var(--border)) 0px, hsl(var(--border)) 4px, transparent 4px, transparent 8px)' }} />
                          )}
                        </div>
                        <div className={`pt-1 ${i < HOW_IT_WORKS.length - 1 ? 'pb-4' : ''}`}>
                          <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Note */}
                  <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Identity verification is required to receive payouts from ticket sales. You can create and publish your event now.
                    </p>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex flex-col gap-2">
                    <Button onClick={handleCreateEvent} className="w-full h-11" disabled={isLoading}>
                      {isLoading ? <Loader size="sm" className="mr-2" /> : null}
                      Create my first event
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={handleComplete} className="w-full h-11" disabled={isLoading}>
                      Go to dashboard
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-0">
              <div className="border-t border-border/40 pt-4">
                {step === 1 ? (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Skip for now
                    </button>
                    <Button onClick={handleNext} className="h-10 px-6">
                      Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}
              </div>
            </div>

          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogRoot>
  );
};
