import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, X, ArrowRight, ChevronLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/ui/loader';
import { EventPreferencesStep } from '@/components/onboarding/EventPreferencesStep';
import { ProcessOverview } from '@/components/onboarding/ProcessOverview';
import { ActionChoiceStep } from '@/components/onboarding/ActionChoiceStep';
import { useAuthContext } from '@/hooks/useAuthContext';
import { getVerificationStatus, type VerificationStatus } from '@/lib/verification-api';
import Logo from '@/components/layout/Logo';

type OnboardingStep = 1 | 2 | 3;

const ONBOARDING_STORAGE_KEY = 'eventknit_onboarding_draft';

interface OnboardingDraft {
  formData: {
    eventTypes: string[];
    organizationType: string;
    eventsPerYear: string;
    isRecurringSeries: boolean;
  };
  currentStep: OnboardingStep;
  timestamp: number;
}

function loadOnboardingDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const draft: OnboardingDraft = JSON.parse(raw);
    if (Date.now() - draft.timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function saveOnboardingDraft(formData: OnboardingDraft['formData'], currentStep: OnboardingStep) {
  try {
    const draft: OnboardingDraft = { formData, currentStep, timestamp: Date.now() };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage errors
  }
}

function clearOnboardingDraft() {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

const STEPS = [
  { label: 'Your events' },
  { label: 'How it works' },
  { label: 'Get started' },
];

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: { user }, dispatch } = useAuthContext();
  const draft = loadOnboardingDraft();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(draft?.currentStep ?? 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventCreatedMessage, setEventCreatedMessage] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);

  useEffect(() => {
    const state = location.state as { message?: string; eventCreated?: boolean } | null;
    if (state?.eventCreated && state?.message) {
      setEventCreatedMessage(state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchVerification = async () => {
      if (eventCreatedMessage) {
        try {
          const response = await getVerificationStatus();
          if (response.success && response.data) {
            setVerificationStatus(response.data);
            if (!response.data.identityVerified) setShowVerificationReminder(true);
          }
        } catch {
          // non-critical
        }
      }
    };
    fetchVerification();
  }, [eventCreatedMessage]);

  const [formData, setFormData] = useState(() => draft?.formData ?? {
    eventTypes: [] as string[],
    organizationType: '',
    eventsPerYear: '',
    isRecurringSeries: false,
  });

  useEffect(() => {
    saveOnboardingDraft(formData, currentStep);
  }, [formData, currentStep]);

  const handleUpdatePreferences = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setError('');
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (formData.eventTypes.length === 0) { setError('Please select at least one event type'); return; }
      if (!formData.organizationType) { setError('Organization type is required'); return; }
      if (!formData.eventsPerYear) { setError('Please select how many events you plan to organize'); return; }
      setError('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
      try {
        const { completeOnboarding } = await import('@/lib/organizer-api');
        const response = await completeOnboarding(formData);
        if (response.success && response.data && user) {
          clearOnboardingDraft();
          dispatch({ type: 'UPDATE_USER', payload: { ...user, onboardingCompleted: true } });
        }
      } catch (err) {
        console.error('Failed to complete onboarding:', err);
      }
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { completeOnboarding } = await import('@/lib/organizer-api');
      const response = await completeOnboarding(formData);
      if (response.success && response.data && user) {
        clearOnboardingDraft();
        dispatch({ type: 'UPDATE_USER', payload: { ...user, onboardingCompleted: true } });
        navigate('/organizer/events/create-standalone');
      } else {
        throw new Error(response.message || 'Failed to complete onboarding');
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err.message as string) : 'Failed to complete onboarding. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as OnboardingStep);
  };

  const handleSkip = () => {
    navigate('/user/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <EventPreferencesStep formData={formData} onUpdate={handleUpdatePreferences} error={error} />;
      case 2: return <ProcessOverview />;
      case 3: return <ActionChoiceStep onComplete={handleComplete} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <Logo />
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleSkip}>
          Skip for now
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">

          {/* Step progress */}
          <div className="flex items-center justify-center mb-10">
            {STEPS.map((step, i) => {
              const stepNum = i + 1;
              const isCompleted = stepNum < currentStep;
              const isActive = stepNum === currentStep;
              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                      isCompleted ? 'bg-emerald-500 text-white' :
                      isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : stepNum}
                    </div>
                    <span className={`text-[11px] font-medium whitespace-nowrap ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-16 sm:w-24 h-px mx-2 mb-5 transition-colors ${stepNum < currentStep ? 'bg-emerald-400' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Alerts */}
          {eventCreatedMessage && (
            <Alert className="mb-6 border-emerald-500/20 bg-emerald-500/5">
              <AlertDescription className="text-emerald-700 dark:text-emerald-400">{eventCreatedMessage}</AlertDescription>
            </Alert>
          )}
          {showVerificationReminder && verificationStatus && !verificationStatus.identityVerified && (
            <Alert className="mb-6 border-primary/20 bg-primary/5">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-foreground flex-1">
                  <strong>Verification speeds up approvals.</strong> Complete identity verification to help your events get approved faster and enable payouts.
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/organizer/verification', { state: { redirectAfterVerification: '/organizer/onboarding' } })}>
                    Verify Identity
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowVerificationReminder(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Step card */}
          <div className="bg-card border border-border/40 rounded-2xl shadow-sm p-6 sm:p-8">
            {renderStep()}

            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}

            {/* Navigation */}
            {currentStep < 3 && (
              <div className={`flex items-center mt-8 ${currentStep > 1 ? 'justify-between' : 'justify-end'}`}>
                {currentStep > 1 && (
                  <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button onClick={handleNext} className="px-6 h-11" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader size="sm" className="mr-2" />Loading...</>
                  ) : (
                    <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Step {currentStep} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
