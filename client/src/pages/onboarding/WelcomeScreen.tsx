/**
 * Onboarding Screen 1: Welcome & Intent
 *
 * Purpose: Understand what user wants to do (without locking them into a role)
 * Collects: intent - "attend" | "organize" | "both"
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Ticket } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuthContext } from '@/hooks/useAuthContext';

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { saveProgress, skip, isLoading } = useOnboarding();
  const { state } = useAuthContext();
  const [selectedIntent, setSelectedIntent] = useState<Set<string>>(new Set());

  const toggleIntent = (intent: string) => {
    const newSelected = new Set(selectedIntent);
    if (newSelected.has(intent)) {
      newSelected.delete(intent);
    } else {
      newSelected.add(intent);
    }
    setSelectedIntent(newSelected);
  };

  const handleContinue = async () => {
    if (selectedIntent.size === 0) return;

    // Determine intent value
    let intent: 'attend' | 'organize' | 'both';
    if (selectedIntent.has('attend') && selectedIntent.has('organize')) {
      intent = 'both';
    } else if (selectedIntent.has('organize')) {
      intent = 'organize';
    } else {
      intent = 'attend';
    }

    try {
      // Save progress with intent
      await saveProgress({ intent });

      // Navigate to appropriate next screen
      if (intent === 'attend') {
        navigate('/onboarding/interests');
      } else if (intent === 'organize') {
        navigate('/onboarding/event-types');
      } else {
        // Both - show interests first
        navigate('/onboarding/interests');
      }
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await skip();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  const firstName = state.user?.firstName || 'there';

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={5}
      title={`Welcome to EventKnit, ${firstName}!`}
      subtitle="Let's personalize your experience"
      showBack={false}
      onSkip={handleSkip}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-section-header mb-2">What brings you here today?</h2>
          <p className="text-page-subtitle">
            Select all that apply. You can always change this later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attend Events Card */}
          <Card
            className={`p-6 cursor-pointer transition-all duration-200 hover:border-primary ${
              selectedIntent.has('attend')
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:shadow-md'
            }`}
            onClick={() => toggleIntent('attend')}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div
                className={`p-4 rounded-full ${
                  selectedIntent.has('attend')
                    ? 'bg-primary/10'
                    : 'bg-muted'
                }`}
              >
                <Ticket className={`w-8 h-8 ${
                  selectedIntent.has('attend') ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>

              <div>
                <h3 className="text-card-title mb-1">Attend events</h3>
                <p className="text-card-description">
                  Discover and register for events
                </p>
              </div>

              <div className="pt-2">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIntent.has('attend')
                      ? 'border-primary bg-primary'
                      : 'border-border'
                  }`}
                >
                  {selectedIntent.has('attend') && (
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Organize Events Card */}
          <Card
            className={`p-6 cursor-pointer transition-all duration-200 hover:border-primary ${
              selectedIntent.has('organize')
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:shadow-md'
            }`}
            onClick={() => toggleIntent('organize')}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div
                className={`p-4 rounded-full ${
                  selectedIntent.has('organize')
                    ? 'bg-primary/10'
                    : 'bg-muted'
                }`}
              >
                <Calendar className={`w-8 h-8 ${
                  selectedIntent.has('organize') ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>

              <div>
                <h3 className="text-card-title mb-1">Organize events</h3>
                <p className="text-card-description">
                  Create and manage events
                </p>
              </div>

              <div className="pt-2">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIntent.has('organize')
                      ? 'border-primary bg-primary'
                      : 'border-border'
                  }`}
                >
                  {selectedIntent.has('organize') && (
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <span className="text-lg">💡</span>
          <span>You can do both! Select what interests you.</span>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleContinue}
            disabled={selectedIntent.size === 0 || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Saving...' : 'Continue →'}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default WelcomeScreen;
