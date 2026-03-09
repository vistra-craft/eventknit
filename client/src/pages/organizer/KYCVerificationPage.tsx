import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useAuth } from '@/hooks/useAuth';

import { EntityTypeSelector } from '@/components/kyc/EntityTypeSelector';
import { DocumentUploadWizard } from '@/components/kyc/DocumentUploadWizard';
import { DirectorsForm } from '@/components/kyc/DirectorsForm';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  setEntityType,
  getKYCRequirements,
  getKYCDocuments,
  createKYCDocument,
  deleteKYCDocument,
  submitKYCForReview,
  getDirectors,
  createDirector,
  deleteDirector,
  OrganizerEntityType,
  KYCDocumentType,
  type DocumentRequirement,
  type KYCDocument,
  type OrganizerDirector,
  type CreateDirectorData,
} from '@/lib/organizer-api';

import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

type Step = 'entity-type' | 'directors' | 'documents' | 'review';

const STEPS: Step[] = ['entity-type', 'directors', 'documents', 'review'];

const KYCVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('entity-type');

  const [selectedEntityType, setSelectedEntityType] =
    useState<OrganizerEntityType | null>(null);

  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [directors, setDirectors] = useState<OrganizerDirector[]>([]);
  const [requiresDirectors, setRequiresDirectors] = useState(false);
  const [minDirectors, setMinDirectors] = useState<number>();
  const [maxDirectorsToCollect, setMaxDirectorsToCollect] = useState<number>();

  // Get the redirect path from location state, with role-aware default
  const isOrganizer = user && ['ORGANIZER', 'ORGANIZER_STAFF', 'ORGANIZER_TELLER'].includes(user.role);
  const defaultRedirect = isOrganizer ? '/organizer/dashboard' : '/user/dashboard';
  const redirectPath = (location.state as { redirectAfterVerification?: string } | null)?.redirectAfterVerification || defaultRedirect;

  const handleBackClick = () => {
    navigate(redirectPath, { replace: true });
  };

  const loadKYCData = useCallback(async () => {
    try {
      setLoading(true);

      const [requirementsRes, documentsRes, directorsRes] = await Promise.all([
        getKYCRequirements(),
        getKYCDocuments().catch(() => ({
          success: true,
          data: { documents: [], isComplete: false },
        })),
        getDirectors().catch(() => ({
          success: true,
          data: { directors: [] },
        })),
      ]);

      if (requirementsRes.success && requirementsRes.data.entityType) {
        const data = requirementsRes.data;

        setSelectedEntityType(data.entityType);
        setRequirements(data.documents);
        setRequiresDirectors(data.requiresDirectors);
        setMinDirectors(data.minDirectors);
        setMaxDirectorsToCollect(data.maxDirectorsToCollect);

        if (data.requiresDirectors && directorsRes.data.directors.length === 0) {
          setCurrentStep('directors');
        } else if (!documentsRes.data.isComplete) {
          setCurrentStep('documents');
        } else {
          setCurrentStep('review');
        }
      }

      setDocuments(documentsRes.data.documents);
      setDirectors(directorsRes.data.directors);
    } catch (err: unknown) {
      showErrorToast(toast, err, 'Failed to load KYC data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadKYCData();
  }, [loadKYCData]);

  const handleEntityTypeSelect = async (type: OrganizerEntityType) => {
    setSelectedEntityType(type);

    try {
      await setEntityType({ entityType: type });
      const res = await getKYCRequirements();

      if (res.success) {
        setRequirements(res.data.documents);
        setRequiresDirectors(res.data.requiresDirectors);
        setMinDirectors(res.data.minDirectors);
        setMaxDirectorsToCollect(res.data.maxDirectorsToCollect);
        setCurrentStep(res.data.requiresDirectors ? 'directors' : 'documents');
      }
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Failed to set entity type');
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      const res = await submitKYCForReview();
      if (res.success) {
        toast({
          title: 'KYC submitted successfully',
          description:
            'Your documents have been submitted for review. We will notify you once the review is complete.',
        });
        // Navigate to redirect path with replace to avoid going back to KYC page
        navigate(redirectPath, { replace: true });
      }
    } catch (error: unknown) {
      showErrorToast(toast, error, 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUpload = async (data: {
    documentType: KYCDocumentType;
    documentNumber?: string;
    documentUrl: string;
    issueDate?: string;
    expiryDate?: string;
  }) => {
    // Convert to the format expected by createKYCDocument
    const result = await createKYCDocument({
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      documentUrl: data.documentUrl,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
    });
    if (result.success) {
      await loadKYCData();
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    const result = await deleteKYCDocument(documentId);
    if (result.success) {
      await loadKYCData();
    }
  };

  const handleDirectorAdd = async (data: CreateDirectorData) => {
    const result = await createDirector(data);
    if (result.success) {
      await loadKYCData();
    }
  };

  const handleDirectorDelete = async (directorId: string) => {
    const result = await deleteDirector(directorId);
    if (result.success) {
      await loadKYCData();
    }
  };

  /* ---------------------- Step Navigation ---------------------- */

  const canAdvanceFromDirectors = (): boolean => {
    const min = minDirectors ?? 1;
    return directors.length >= min;
  };

  const canAdvanceFromDocuments = (): boolean => {
    const requiredDocs = requirements.filter(r => r.isRequired && !r.isConditional);
    return requiredDocs.every(req => {
      const uploaded = documents.filter(
        doc => doc.documentType === req.documentType &&
               (doc.status === 'PENDING' || doc.status === 'APPROVED')
      );
      return uploaded.length >= req.minQuantity;
    });
  };

  const handleStepBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex <= 0) return;

    let prevStep = STEPS[currentIndex - 1];
    if (prevStep === 'directors' && !requiresDirectors) {
      prevStep = 'entity-type';
    }
    setCurrentStep(prevStep);
  };

  const handleStepNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex >= STEPS.length - 1) return;

    if (currentStep === 'directors' && !canAdvanceFromDirectors()) {
      toast({
        title: 'More directors needed',
        description: `Please add at least ${minDirectors ?? 1} director(s) before continuing.`,
        variant: 'destructive',
      });
      return;
    }

    if (currentStep === 'documents' && !canAdvanceFromDocuments()) {
      toast({
        title: 'Documents required',
        description: 'Please upload all required documents before continuing.',
        variant: 'destructive',
      });
      return;
    }

    let nextStep = STEPS[currentIndex + 1];
    if (nextStep === 'directors' && !requiresDirectors) {
      nextStep = 'documents';
    }
    setCurrentStep(nextStep);
  };

  if (loading) {
    return (
        <div className="flex justify-center min-h-[400px] items-center">
          <Loader size="lg" />
        </div>
    );
  }

  return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <BackButton 
          onClick={handleBackClick}
          label="Back to Dashboard" 
        />

        <h1 className="text-3xl font-bold mt-6">KYC Verification</h1>
        <p className="text-muted-foreground mb-8">
          Complete your identity verification to enable paid events and payouts
        </p>

        {/* Step Indicator */}
        <div className="flex justify-between mb-8">
          {STEPS.map((step, index) => {
            const isActive = step === currentStep;
            const isCompleted = STEPS.indexOf(currentStep) > index;

            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-success text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 /> : index + 1}
                  </div>
                  <span className="mt-2 text-xs capitalize">
                    {step.replace('-', ' ')}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-success' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {currentStep === 'entity-type' && (
              <EntityTypeSelector
                selectedType={selectedEntityType}
                onSelect={handleEntityTypeSelect}
                onNext={() =>
                  setCurrentStep(
                    requiresDirectors ? 'directors' : 'documents',
                  )
                }
              />
            )}



            {currentStep === 'directors' && requiresDirectors && (
              <DirectorsForm
                directors={directors}
                minDirectors={minDirectors}
                maxDirectorsToCollect={maxDirectorsToCollect}
                onAdd={handleDirectorAdd}
                onDelete={handleDirectorDelete}
              />
            )}

            {currentStep === 'documents' && (
              <DocumentUploadWizard
                requirements={requirements}
                uploadedDocuments={documents}
                onUpload={handleDocumentUpload}
                onDelete={handleDocumentDelete}
              />
            )}

            {currentStep === 'review' && (
              <>
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Review takes 1–3 business days after submission.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSubmitForReview} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit for Review'}
                  </Button>
                </div>
              </>
            )}

            {/* Step Navigation */}
            {currentStep !== 'entity-type' && (
              <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleStepBack}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                {currentStep !== 'review' && (
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    onClick={handleStepNext}
                    disabled={
                      (currentStep === 'directors' && !canAdvanceFromDirectors()) ||
                      (currentStep === 'documents' && !canAdvanceFromDocuments())
                    }
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default KYCVerificationPage;
