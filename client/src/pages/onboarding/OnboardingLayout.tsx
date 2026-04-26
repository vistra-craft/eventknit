import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/layout/Logo';
import appointmentAnimation from '@/assets/lottie/appointment.json';

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
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left panel — Lottie + branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col justify-center items-center relative overflow-hidden bg-background px-8 xl:px-12">
        {/* Subtle corner accents */}
        <svg className="absolute top-0 left-0 w-56 h-56 pointer-events-none" viewBox="0 0 224 224" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="ob-tl-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.08" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="0" x2="224" y2="224" stroke="url(#ob-tl-grad)" strokeWidth="1.5" />
          <line x1="0" y1="40" x2="184" y2="224" stroke="url(#ob-tl-grad)" strokeWidth="0.8" />
          <line x1="40" y1="0" x2="224" y2="184" stroke="url(#ob-tl-grad)" strokeWidth="0.8" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-56 h-56 pointer-events-none" viewBox="0 0 224 224" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="ob-br-grad" x1="1" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.08" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="224" y1="224" x2="0" y2="0" stroke="url(#ob-br-grad)" strokeWidth="1.5" />
          <line x1="224" y1="184" x2="40" y2="0" stroke="url(#ob-br-grad)" strokeWidth="0.8" />
          <line x1="184" y1="224" x2="0" y2="40" stroke="url(#ob-br-grad)" strokeWidth="0.8" />
        </svg>

        <motion.div
          className="relative z-10 flex flex-col items-center w-full max-w-sm"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="mb-10 self-start">
            <Logo />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <Lottie animationData={appointmentAnimation} loop className="w-full" />
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-sm text-muted-foreground">
              Step <span className="font-semibold text-foreground">{currentStep}</span> of{' '}
              <span className="font-semibold text-foreground">{totalSteps}</span>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel — form content */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <motion.div
          className="w-full max-w-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Logo />
          </div>

          {/* Top bar: back + skip */}
          <div className="flex items-center justify-between mb-5">
            <div>
              {showBack && currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <span />
              )}
            </div>

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

          {/* Progress bar */}
          <div className="flex gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <motion.div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index < currentStep ? 'bg-primary' : 'bg-border'
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              />
            ))}
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-page-title mb-2">{title}</h1>
            {subtitle && <p className="text-page-subtitle">{subtitle}</p>}
          </div>

          {/* Content card */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
