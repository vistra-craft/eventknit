import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Shield, Circle, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import OrganizerLayout from './OrganizerLayout';
import VerificationForm from '@/components/verification/VerificationForm';
import { getVerificationStatus, type VerificationStatus } from '@/lib/verification-api';
const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [accountType, setAccountType] = useState<'individual' | 'business' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Get redirect path from location state or query params
  const redirectPath = (location.state as { redirectAfterVerification?: string } | null)?.redirectAfterVerification ||
                      new URLSearchParams(location.search).get('redirect') ||
                      '/organizer/dashboard';

  // Load verification status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        setLoadingStatus(true);
        const response = await getVerificationStatus();
        if (response.success && response.data) {
          setVerificationStatus(response.data);
        }
      } catch (error) {
        console.error('Error loading verification status:', error);
      } finally {
        setLoadingStatus(false);
      }
    };
    loadStatus();

    // Listen for verification status updates
    const handleVerificationUpdate = () => {
      loadStatus();
    };
    window.addEventListener('verificationStatusUpdated', handleVerificationUpdate);

    return () => {
      window.removeEventListener('verificationStatusUpdated', handleVerificationUpdate);
    };
  }, []);

  const handleAccountTypeSelect = (type: 'individual' | 'business') => {
    setAccountType(type);
  };

  const handleVerificationSuccess = () => {
    setShowSuccess(true);
    // Close page after 2 seconds
    setTimeout(() => {
      navigate(redirectPath);
    }, 2000);
  };

  if (showSuccess) {
    return (
      <OrganizerLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-900 mb-2">Verification Submitted!</h2>
                  <p className="text-green-700">
                    Your verification has been submitted successfully. You'll be redirected shortly...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Identity Verification</h1>
          <p className="text-muted-foreground mt-2">
            Complete verification to receive payouts from ticket sales
          </p>
        </div>

        {/* Verification Steps Indicator */}
        {!loadingStatus && verificationStatus && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="space-y-3">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Verification Steps
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {verificationStatus.identityVerified ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${verificationStatus.identityVerified ? 'text-green-700 dark:text-green-300' : 'text-blue-900 dark:text-blue-100'}`}>
                        Step 1: Identity Verification
                      </span>
                      {verificationStatus.identityVerified && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {verificationStatus.identityVerified 
                        ? "Your identity has been verified. You can now create paid events."
                        : "Provide your personal information and upload a government-issued ID (passport, driver's license, or national ID)."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {verificationStatus.verificationLevel === 3 && verificationStatus.kycStatus === 'APPROVED' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${verificationStatus.verificationLevel === 3 && verificationStatus.kycStatus === 'APPROVED' ? 'text-green-700 dark:text-green-300' : 'text-blue-900 dark:text-blue-100'}`}>
                        Step 2: Business Information
                      </span>
                      {verificationStatus.verificationLevel === 3 && verificationStatus.kycStatus === 'APPROVED' && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700">
                          Completed
                        </Badge>
                      )}
                      {verificationStatus.kycStatus === 'PENDING' && (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                          Under Review
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {verificationStatus.verificationLevel === 3 && verificationStatus.kycStatus === 'APPROVED'
                        ? "Your business information is complete. You can receive unlimited payouts."
                        : verificationStatus.kycStatus === 'PENDING'
                        ? "Your business information is under review."
                        : verificationStatus.payoutLimit
                        ? `Optional: Provide business information to remove the $${verificationStatus.payoutLimit.toLocaleString()}/month payout limit. You can still receive payouts with just identity verification.`
                        : "Optional: Provide business information for unlimited payouts and higher event limits."}
                    </p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!accountType ? (
          <Card>
            <CardHeader>
              <CardTitle>Account Type</CardTitle>
              <CardDescription>
                Are you registering as an individual or a business?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={accountType || ''}
                onValueChange={(value) => handleAccountTypeSelect(value as 'individual' | 'business')}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">Individual</div>
                      <div className="text-sm text-muted-foreground">
                        I'm registering as an individual person
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="business" id="business" />
                  <Label htmlFor="business" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">Business</div>
                      <div className="text-sm text-muted-foreground">
                        I'm registering as a business or organization
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        ) : (
          <VerificationForm
            redirectAfterBusinessVerification={redirectPath}
            accountType={accountType}
            onSuccess={handleVerificationSuccess}
          />
        )}
      </div>
    </OrganizerLayout>
  );
};

export default VerificationPage;
