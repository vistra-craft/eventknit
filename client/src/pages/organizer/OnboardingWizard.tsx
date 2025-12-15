import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Shield, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EventPreferencesStep } from '@/components/onboarding/EventPreferencesStep';
import { ProcessOverview } from '@/components/onboarding/ProcessOverview';
import { ActionChoiceStep } from '@/components/onboarding/ActionChoiceStep';
import { useAuthContext } from '@/hooks/useAuthContext';
import { getVerificationStatus, type VerificationStatus } from '@/lib/verification-api';
import Logo from '@/components/Logo';

type OnboardingStep = 1 | 2 | 3;

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: { user }, dispatch } = useAuthContext();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
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

  const [formData, setFormData] = useState({
    eventTypes: [] as string[],
    organizationType: '',
    eventsPerYear: '',
    isRecurringSeries: false,
  });

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate('/auth/email-entry')}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-primary hover:bg-accent-coral hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Sign Up</span>
            </button>
            <Logo to="/" />
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary text-white'
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
        <div className="bg-card-surface rounded-2xl shadow-sm p-8">
            {/* Event Created Success Message */}
            {eventCreatedMessage && (
              <Alert className="mb-6 border-green-500/20 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {eventCreatedMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Verification Reminder */}
            {showVerificationReminder && verificationStatus && !verificationStatus.identityVerified && (
              <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-blue-900 dark:text-blue-100 flex-1">
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
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                      Verify Identity
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVerificationReminder(false)}
                      className="text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
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
                  variant="outline"
                  className="px-6 bg-card-surface border-2 border-border hover:bg-accent-coral hover:text-white hover:border-transparent text-foreground font-medium transition-colors shadow-none focus:shadow-none focus-visible:shadow-none"
                  disabled={isLoading}
                >
                  Continue
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

