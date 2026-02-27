/**
 * KYC Required Banner
 * Shows a prominent banner when user has approved events but incomplete KYC
 * Displayed on dashboard and settings pages
 */

import { AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface KYCRequiredBannerProps {
  hasApprovedEvents: boolean;
  isKYCIncomplete: boolean;
  variant?: 'banner' | 'card';
  onNavigateToKYC?: () => void;
}

export const KYCRequiredBanner = ({
  hasApprovedEvents,
  isKYCIncomplete,
  variant = 'banner',
  onNavigateToKYC,
}: KYCRequiredBannerProps) => {
  const navigate = useNavigate();

  if (!hasApprovedEvents || !isKYCIncomplete) {
    return null;
  }

  const handleNavigate = () => {
    if (onNavigateToKYC) {
      onNavigateToKYC();
    } else {
      navigate('/user/dashboard?view=settings&tab=verification');
    }
  };

  if (variant === 'card') {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10">
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Complete KYC Verification
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                Your event has been approved! Complete your KYC verification to start receiving payouts from ticket sales.
              </p>
              <Button
                onClick={handleNavigate}
                size="sm"
                variant="default"
                className="bg-amber-600 hover:bg-amber-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Complete KYC Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Alert className="border-amber-500/20 bg-amber-500/10 dark:bg-amber-500/5">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <strong>Action Required:</strong> Your event has been approved! Complete KYC verification to receive payouts.
          </div>
          <Button
            onClick={handleNavigate}
            size="sm"
            variant="outline"
            className="flex-shrink-0"
          >
            Verify Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
