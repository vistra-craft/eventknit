import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Shield, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/ui/loader';
import { EventPreferencesStep } from '@/components/onboarding/EventPreferencesStep';
import { ProcessOverview } from '@/components/onboarding/ProcessOverview';
import { ActionChoiceStep } from '@/components/onboarding/ActionChoiceStep';
import { useAuthContext } from '@/hooks/useAuthContext';
import { getVerificationStatus, type VerificationStatus } from '@/lib/verification-api';
import BackButton from '@/components/BackButton';
import Logo from '@/components/Logo';

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
    // Expire after 7 days
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

  // Check if event was just created (from location state)
  useEffect(() => {
    const state = location.state as { message?: string; eventCreated?: boolean } | null;
    if (state?.eventCreated && state?.message) {
      setEventCreatedMessage(state.message);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch verification status when event is created
  useEffect(() => {
    const fetchVerification = async () => {
      if (eventCreatedMessage) {
        try {
          const response = await getVerificationStatus();
          if (response.success && response.data) {
            setVerificationStatus(response.data);
            // Show reminder if not verified
            if (!response.data.identityVerified) {
              setShowVerificationReminder(true);
            }
          }
        } catch (error) {
          console.error('Failed to fetch verification status:', error);
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

  // Persist draft to localStorage whenever form data or step changes
  useEffect(() => {
    saveOnboardingDraft(formData, currentStep);
  }, [formData, currentStep]);

  const handleUpdatePreferences = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setError('');
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate step 1
      if (formData.eventTypes.length === 0) {
        setError('Please select at least one event type');
        return;
      }
      if (!formData.organizationType) {
        setError('Organization type is required');
        return;
      }
      if (!formData.eventsPerYear) {
        setError('Please select how many events you plan to organize');
        return;
      }
      setError('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2 is just informational, move to step 3
      // Complete onboarding when moving to step 3 (final step)
      setCurrentStep(3);
      // Automatically complete onboarding when reaching the action choice step
      try {
        const { completeOnboarding } = await import('@/lib/organizer-api');
        const response = await completeOnboarding(formData);
        if (response.success && response.data && user) {
          clearOnboardingDraft();
          dispatch({
            type: 'UPDATE_USER',
            payload: { ...user, onboardingCompleted: true }
          });
        }
      } catch (err) {
        // Silently fail - onboarding will be completed when user chooses an action
        console.error('Failed to complete onboarding:', err);
      }
    }
    // Step 3 doesn't have a "next" button - user chooses an action
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Save event preferences and mark onboarding as complete via API
      const { completeOnboarding } = await import('@/lib/organizer-api');
      const response = await completeOnboarding(formData);

      if (response.success && response.data && user) {
        clearOnboardingDraft();
        // Update user context with completed onboarding
        dispatch({
          type: 'UPDATE_USER',
          payload: { ...user, onboardingCompleted: true }
        });

        // Navigate to standalone event creation (onboarding complete, but need to create first event)
        navigate('/organizer/events/create-standalone');
      } else {
        throw new Error(response.message || 'Failed to complete onboarding');
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to complete onboarding. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <EventPreferencesStep
            formData={formData}
            onUpdate={handleUpdatePreferences}
            error={error}
          />
        );
      case 2:
        return <ProcessOverview />;
      case 3:
        return <ActionChoiceStep onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <BackButton to="/auth/signup" label="Back to Sign Up" />
            <Logo />
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-card-surface rounded-2xl shadow-md p-8">
            {/* Event Created Success Message */}
            {eventCreatedMessage && (
              <Alert className="mb-6 border-success/20 bg-success-light">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  {eventCreatedMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Verification Reminder */}
            {showVerificationReminder && verificationStatus && !verificationStatus.identityVerified && (
              <Alert className="mb-6 border-primary/20 bg-primary/5">
                <Shield className="h-4 w-4 text-primary" />
                <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-foreground flex-1">
                    <strong>Verification Required:</strong> Complete identity verification to help speed up event approval and receive payouts from ticket sales.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate('/organizer/verification', {
                          state: { redirectAfterVerification: '/organizer/onboarding' }
                        });
                      }}
                      className="border-primary/30 text-primary hover:bg-primary/10"
                    >
                      Verify Identity
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVerificationReminder(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {renderStep()}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 3 && (
              <div className="flex justify-end mt-8">
                <Button
                  onClick={handleNext}
                  variant="default"
                  className="px-6 h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            )}

            {/* Step 3 doesn't need navigation buttons - ActionChoiceStep handles it */}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;

