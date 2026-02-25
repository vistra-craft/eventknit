/**
 * Onboarding Screen 5: Completion
 *
 * Purpose: Celebrate completion and redirect to dashboard
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useAuthContext } from '@/hooks/useAuthContext';

export const CompletionScreen = () => {
  const navigate = useNavigate();
  const { state } = useAuthContext();

  const role = state.user?.role;
  const isOrganizerRole =
    role === 'ORGANIZER' || role === 'ORGANIZER_STAFF' || role === 'ORGANIZER_TELLER';
  const dashboardRoute = isOrganizerRole ? '/organizer/dashboard' : '/dashboard';

  // Auto-redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(dashboardRoute);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, dashboardRoute]);

  const handleContinue = () => {
    navigate(dashboardRoute);
  };

  const firstName = state.user?.firstName || 'there';

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={5}
      title="You're all set!"
      subtitle=""
      showBack={false}
      showSkip={false}
    >
      <div className="space-y-8 text-center py-8">
        {/* Success Icon with Animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative bg-primary/10 p-6 rounded-full animate-in zoom-in-50 duration-500">
              <CheckCircle2 className="w-20 h-20 text-primary animate-in zoom-in-75 duration-700 delay-200" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-section-header">
            Welcome to EventKnit, {firstName}! 🎉
          </h2>
          <p className="text-page-subtitle max-w-md mx-auto">
            Your account is ready. Let's start discovering amazing events!
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3 max-w-md mx-auto text-left animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          {[
            'Discover events tailored to your interests',
            'Get notified about upcoming events',
            'Save and share your favorite events',
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-page-subtitle animate-in fade-in slide-in-from-left duration-500"
              style={{ animationDelay: `${600 + index * 100}ms` }}
            >
              <div className="p-1 rounded-full bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000">
          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full max-w-xs mx-auto shadow-primary hover:shadow-primary hover:scale-105 transition-all duration-300"
          >
            Go to Dashboard →
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Redirecting automatically in 3 seconds...
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default CompletionScreen;
