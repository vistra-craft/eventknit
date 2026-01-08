import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';

import OrganizerLayout from './OrganizerLayout';
import { EntityTypeSelector } from '@/components/kyc/EntityTypeSelector';
import { DocumentUploadWizard } from '@/components/kyc/DocumentUploadWizard';
import { DirectorsForm } from '@/components/kyc/DirectorsForm';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  type DocumentRequirement,
  type KYCDocument,
  type OrganizerDirector,
} from '@/lib/organizer-api';

import { useToast } from '@/hooks/useToast';

type Step = 'entity-type' | 'directors' | 'documents' | 'review';

const STEPS: Step[] = ['entity-type', 'directors', 'documents', 'review'];

const KYCVerificationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
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
    } catch (error: unknown) {
      toast({
        title: 'Failed to load KYC data',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEntityTypeSelect = async (type: OrganizerEntityType) => {
    setSelectedEntityType(type);

    try {
      await setEntityType({ entityType: type });
      const res = await getKYCRequirements();

      if (res.success) {
        setRequirements(res.data.documents);
        setRequiresDirectors(res.data.requiresDirectors);
        setMinDirectors(res.data.minDirectors);
        setCurrentStep(res.data.requiresDirectors ? 'directors' : 'documents');
      }
    } catch (error: unknown) {
      toast({
        title: 'Failed to set entity type',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
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
        navigate('/organizer/dashboard');
      }
    } catch (error: unknown) {
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUpload = async (data: { file: File; documentType: string; description?: string }) => {
    const result = await createKYCDocument(data);
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

  const handleDirectorAdd = async (data: { name: string; position: string; shareholdingPercentage?: number; idNumber?: string; nationality?: string }) => {
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

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex justify-center min-h-[400px] items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <BackButton to="/organizer/dashboard" label="Back to Dashboard" />

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
                        ? 'bg-green-500 text-white'
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
                  <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
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
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  );
};

export default KYCVerificationPage;
