import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import OrganizerLayout from './OrganizerLayout';
import VerificationForm from '@/components/verification/VerificationForm';
const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [accountType, setAccountType] = useState<'individual' | 'business' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get redirect path from location state or query params
  const redirectPath = (location.state as { redirectAfterVerification?: string } | null)?.redirectAfterVerification ||
                      new URLSearchParams(location.search).get('redirect') ||
                      '/organizer/dashboard';

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
