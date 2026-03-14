/**
 * KYC Verification Section Component
 * Reusable component for displaying KYC verification status and upload
 * Used in both attendee and organizer settings pages
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Badge as BadgeIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type VerificationStatus } from '@/lib/verification-api';

interface KYCVerificationSectionProps {
  verificationStatus: VerificationStatus | null;
  onKYCStatusChange?: () => void;
  isAttendeeFlow?: boolean;
}

const KYCVerificationSection: React.FC<KYCVerificationSectionProps> = ({
  verificationStatus,
  onKYCStatusChange,
  isAttendeeFlow = true,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOrganizer = user && ['ORGANIZER', 'ORGANIZER_ADMIN', 'ORGANIZER_TELLER'].includes(user.role);
  const kycBasePath = isOrganizer ? '/organizer' : '/user';

  useEffect(() => {
    onKYCStatusChange?.();
  }, [onKYCStatusChange]);

  const handleStartKYC = () => {
    if (isAttendeeFlow) {
      // For attendees, stay in attendee dashboard
      navigate(`${kycBasePath}/kyc`, {
        state: {
          redirectAfterVerification: '/user/dashboard?view=settings&tab=verification',
          isNewOrganizer: true,
        },
      });
    } else {
      // For organizers, already in organizer dashboard
      navigate('/organizer/kyc');
    }
  };

  if (!verificationStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const kycStatus = verificationStatus.kycStatus;
  const verificationLevel = verificationStatus.verificationLevel;
  const canCreatePaidEvents = verificationStatus.canCreatePaidEvents;
  const canReceivePayouts = verificationStatus.canReceivePayouts;

  return (
    <div className="space-y-6">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verification Level Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BadgeIcon className="h-4 w-4" />
              Verification Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{verificationLevel || 0}/3</span>
              <Badge
                className={
                  verificationLevel === 3
                    ? 'bg-success'
                    : verificationLevel === 2
                    ? 'bg-blue-600'
                    : verificationLevel === 1
                    ? 'bg-amber-600'
                    : 'bg-muted'
                }
              >
                {verificationLevel === 3
                  ? 'Full KYC'
                  : verificationLevel === 2
                  ? 'Identity Verified'
                  : verificationLevel === 1
                  ? 'Email Verified'
                  : 'Basic'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {verificationLevel === 3
                ? 'All verifications completed'
                : verificationLevel === 2
                ? 'Identity verified, KYC pending'
                : verificationLevel === 1
                ? 'Email verified, identity pending'
                : 'No verifications completed'}
            </p>
          </CardContent>
        </Card>

        {/* KYC Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              KYC Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge
                className={
                  kycStatus === 'APPROVED'
                    ? 'bg-success text-white'
                    : kycStatus === 'PENDING'
                    ? 'bg-amber-600 text-white'
                    : kycStatus === 'REJECTED'
                    ? 'bg-destructive text-white'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }
              >
                {kycStatus || 'Not Started'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {kycStatus === 'APPROVED'
                ? 'Your KYC has been verified'
                : kycStatus === 'PENDING'
                ? 'Your submission is under review'
                : kycStatus === 'REJECTED'
                ? 'Please resubmit your KYC'
                : 'Start your KYC verification'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What You Can Do</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
            <CheckCircle
              className="h-5 w-5 mt-0.5 flex-shrink-0 text-success"
            />
            <div>
              <p className="font-medium text-foreground">
                Create Free Events
              </p>
              <p className="text-sm text-muted-foreground">Always available</p>
            </div>
          </div>

          <div className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
            <div
              className={`h-5 w-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                canCreatePaidEvents
                  ? 'border-success bg-success/10'
                  : 'border-muted-foreground/30'
              }`}
            >
              {canCreatePaidEvents && <CheckCircle className="h-3 w-3 text-success" />}
            </div>
            <div>
              <p className={`font-medium ${canCreatePaidEvents ? 'text-foreground' : 'text-muted-foreground'}`}>
                Create Paid Events
              </p>
              <p className="text-sm text-muted-foreground">
                {canCreatePaidEvents
                  ? 'Identity verification completed'
                  : 'Requires identity verification'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className={`h-5 w-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                canReceivePayouts
                  ? 'border-success bg-success/10'
                  : 'border-muted-foreground/30'
              }`}
            >
              {canReceivePayouts && <CheckCircle className="h-3 w-3 text-success" />}
            </div>
            <div>
              <p className={`font-medium ${canReceivePayouts ? 'text-foreground' : 'text-muted-foreground'}`}>
                Receive Payouts
              </p>
              <p className="text-sm text-muted-foreground">
                {canReceivePayouts
                  ? 'Full KYC verification completed'
                  : 'Requires complete KYC verification'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Status Messages and Actions */}
      {!kycStatus || kycStatus === 'PENDING' || kycStatus === 'REJECTED' ? (
        <>
          {kycStatus === 'PENDING' && (
            <Alert className="border-amber-500/20 bg-amber-500/10 dark:bg-amber-500/5">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Your KYC submission is under review. This usually takes 1-3 business days. You'll be notified once your verification is complete.
              </AlertDescription>
            </Alert>
          )}

          {kycStatus === 'REJECTED' && (
            <Alert className="border-destructive/20 bg-destructive/10 dark:bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive dark:text-red-400" />
              <AlertDescription className="text-destructive dark:text-red-200">
                Your KYC submission was rejected. Please review the feedback and resubmit with corrected information.
              </AlertDescription>
            </Alert>
          )}

          {!kycStatus && (
            <Alert className="border-blue-500/20 bg-blue-500/10 dark:bg-blue-500/5">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Complete KYC verification to create paid events and receive payouts from ticket sales.
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-blue-200/50 bg-blue-50/30 dark:border-blue-500/20 dark:bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {kycStatus === 'REJECTED'
                  ? 'Resubmit Your KYC'
                  : kycStatus === 'PENDING'
                  ? 'KYC Under Review'
                  : 'Start KYC Verification'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {kycStatus === 'REJECTED'
                  ? 'Please correct the issues and resubmit your documents for verification.'
                  : kycStatus === 'PENDING'
                  ? 'Your submitted documents are being reviewed by our team. You can view or update your submission.'
                  : 'Upload your documents and complete the verification process.'}
              </p>
              <Button onClick={handleStartKYC} className="w-full">
                {kycStatus === 'PENDING' || kycStatus === 'REJECTED'
                  ? 'View/Update'
                  : 'Start Verification'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert className="border-success/20 bg-success/5">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            ✓ Your KYC verification is complete! You can now create paid events and receive payouts.
          </AlertDescription>
        </Alert>
      )}

      {/* KYC Documents List */}
      {verificationStatus.kycDocuments && verificationStatus.kycDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submitted Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verificationStatus.kycDocuments.map((doc) => (
                <div key={doc.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{doc.documentType}</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    className={
                      doc.status === 'APPROVED'
                        ? 'bg-success'
                        : doc.status === 'PENDING'
                        ? 'bg-amber-600'
                        : 'bg-destructive'
                    }
                  >
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KYCVerificationSection;
