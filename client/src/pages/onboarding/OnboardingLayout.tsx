/**
 * Onboarding Layout Component
 *
 * Wrapper for all onboarding screens with:
 * - Progress indicator
 * - Skip functionality
 * - Navigation controls
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showSkip?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
}

export const OnboardingLayout = ({
  children,
  currentStep,
  totalSteps,
  title,
  subtitle,
  showBack = true,
  showSkip = true,
  onBack,
  onSkip,
}: OnboardingLayoutProps) => {
  const navigate = useNavigate();

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      // Default skip behavior - navigate to dashboard
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Default back behavior
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-muted/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {showBack && currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            <Logo />

            {showSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip tour →
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index < currentStep ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
};
