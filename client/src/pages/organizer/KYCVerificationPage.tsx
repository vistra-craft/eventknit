import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import OrganizerLayout from './OrganizerLayout';
import { EntityTypeSelector } from '@/components/kyc/EntityTypeSelector';
import { DocumentUploadWizard } from '@/components/kyc/DocumentUploadWizard';
import { DirectorsForm } from '@/components/kyc/DirectorsForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';

type Step = 'entity-type' | 'additional-info' | 'directors' | 'documents' | 'review';

const INDUSTRY_OPTIONS = [
  { value: 'E_COMMERCE', label: 'E-Commerce' },
  { value: 'ENERGY_PETROLEUM', label: 'Energy/Petroleum' },
  { value: 'TOUR_OPERATOR', label: 'Tour Operator' },
  { value: 'PRIVATE_HOSPITAL', label: 'Private Hospital' },
  { value: 'PRIVATE_EDUCATION', label: 'Private Education' },
  // Add more as needed
];

const KYCVerificationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('entity-type');

  // Entity type selection
  const [selectedEntityType, setSelectedEntityType] = useState<OrganizerEntityType | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState({
    industry: '',
    businessName: '',
    registrationNumber: '',
  });

  // Requirements and data
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [directors, setDirectors] = useState<OrganizerDirector[]>([]);
  const [requiresDirectors, setRequiresDirectors] = useState(false);
  const [minDirectors, setMinDirectors] = useState<number | undefined>();

  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    try {
      setLoading(true);
      const [requirementsRes, documentsRes, directorsRes] = await Promise.all([
        getKYCRequirements(),
        getKYCDocuments().catch(() => ({ success: true, data: { documents: [], requirementsStatus: [], isComplete: false } })),
        getDirectors().catch(() => ({ success: true, data: { directors: [] } })),
      ]);

      if (requirementsRes.success && requirementsRes.data.entityType) {
        setSelectedEntityType(requirementsRes.data.entityType);
        setRequirements(requirementsRes.data.documents);
        setRequiresDirectors(requirementsRes.data.requiresDirectors);
        setMinDirectors(requirementsRes.data.minDirectors);
        
        // Set current step based on what's completed
        if (requirementsRes.data.entityType) {
          if (requirementsRes.data.requiresDirectors && directorsRes.success && directorsRes.data.directors.length === 0) {
            setCurrentStep('directors');
          } else if (documentsRes.success && !documentsRes.data.isComplete) {
            setCurrentStep('documents');
          } else {
            setCurrentStep('review');
          }
        }
      }

      if (documentsRes.success) {
        setDocuments(documentsRes.data.documents);
      }

      if (directorsRes.success) {
        setDirectors(directorsRes.data.directors);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load KYC data',
        description: error?.message || 'An error occurred',
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
      const requirementsRes = await getKYCRequirements();
      if (requirementsRes.success) {
        setRequirements(requirementsRes.data.documents);
        setRequiresDirectors(requirementsRes.data.requiresDirectors);
        setMinDirectors(requirementsRes.data.minDirectors);
        setCurrentStep('additional-info');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to set entity type',
        description: error?.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleContinueFromAdditionalInfo = async () => {
    try {
      await setEntityType({
        entityType: selectedEntityType!,
        industry: additionalInfo.industry || undefined,
        businessName: additionalInfo.businessName || undefined,
        registrationNumber: additionalInfo.registrationNumber || undefined,
      });

      const requirementsRes = await getKYCRequirements();
      if (requirementsRes.success) {
        setRequirements(requirementsRes.data.documents);
        if (requirementsRes.data.requiresDirectors) {
          setCurrentStep('directors');
        } else {
          setCurrentStep('documents');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Failed to save information',
        description: error?.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDocumentUpload = async (data: {
    documentType: any;
    documentNumber?: string;
    documentUrl: string;
    issueDate?: string;
    expiryDate?: string;
  }) => {
    const result = await createKYCDocument(data);
    if (result.success) {
      await loadKYCData(); // Reload to get updated documents
    }
    return result;
  };

  const handleDocumentDelete = async (documentId: string) => {
    const result = await deleteKYCDocument(documentId);
    if (result.success) {
      await loadKYCData(); // Reload to get updated documents
    }
    return result;
  };

  const handleDirectorAdd = async (data: any) => {
    const result = await createDirector(data);
    if (result.success) {
      await loadKYCData(); // Reload to get updated directors
    }
    return result;
  };

  const handleDirectorDelete = async (directorId: string) => {
    const result = await deleteDirector(directorId);
    if (result.success) {
      await loadKYCData(); // Reload to get updated directors
    }
    return result;
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      const result = await submitKYCForReview();
      if (result.success) {
        toast({
          title: 'KYC submitted successfully',
          description: 'Your documents have been submitted for review. We will notify you once the review is complete.',
        });
        navigate('/organizer/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error?.message || 'An error occurred while submitting for review',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/organizer/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
          <p className="text-muted-foreground">
            Complete your identity verification to enable paid events and payouts
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(['entity-type', 'additional-info', 'directors', 'documents', 'review'] as Step[]).map((step, index) => {
              const isActive = step === currentStep;
              const isCompleted = ['entity-type', 'additional-info', 'directors', 'documents', 'review'].indexOf(currentStep) > index;
              
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
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className="mt-2 text-xs text-center capitalize">
                      {step.replace('-', ' ')}
                    </span>
                  </div>
                  {index < 4 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <Card>
          <CardContent className="pt-6">
            {currentStep === 'entity-type' && (
              <EntityTypeSelector
                selectedType={selectedEntityType}
                onSelect={handleEntityTypeSelect}
                onNext={() => {
                  // Check if entity type needs additional info
                  const needsInfo = selectedEntityType && (
                    selectedEntityType === OrganizerEntityType.LIMITED_LIABILITY_COMPANY ||
                    selectedEntityType === OrganizerEntityType.SOLE_PROPRIETOR
                  );
                  setCurrentStep(needsInfo ? 'additional-info' : requiresDirectors ? 'directors' : 'documents');
                }}
              />
            )}

            {currentStep === 'additional-info' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Additional Information</h2>
                  <p className="text-muted-foreground">
                    Provide additional information about your entity
                  </p>
                </div>

                <div className="space-y-4">
                  {requirements.some((r) => r.isConditional) && (
                    <div>
                      <Label htmlFor="industry">Industry (Optional)</Label>
                      <select
                        id="industry"
                        value={additionalInfo.industry}
                        onChange={(e) => setAdditionalInfo({ ...additionalInfo, industry: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select industry...</option>
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="businessName">Business/Trade Name (Optional)</Label>
                    <Input
                      id="businessName"
                      value={additionalInfo.businessName}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, businessName: e.target.value })}
                      placeholder="If different from registration name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="registrationNumber">Registration Number (Optional)</Label>
                    <Input
                      id="registrationNumber"
                      value={additionalInfo.registrationNumber}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, registrationNumber: e.target.value })}
                      placeholder="Business registration/incorporation number"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleContinueFromAdditionalInfo}>
                    Continue
                  </Button>
                </div>
              </div>
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
              <>
                <DocumentUploadWizard
                  requirements={requirements}
                  uploadedDocuments={documents}
                  onUpload={handleDocumentUpload}
                  onDelete={handleDocumentDelete}
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => {
                      // Check if documents are complete
                      const isComplete = requirements
                        .filter((r) => r.isRequired && !r.isConditional)
                        .every((r) => {
                          const uploaded = documents.filter((d) => d.documentType === r.documentType);
                          const approvedCount = uploaded.filter((d) => d.status === 'APPROVED').length;
                          return approvedCount >= r.minQuantity;
                        });
                      
                      if (isComplete) {
                        setCurrentStep('review');
                      } else {
                        toast({
                          title: 'Incomplete documents',
                          description: 'Please upload all required documents before proceeding',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Continue to Review
                  </Button>
                </div>
              </>
            )}

            {currentStep === 'review' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
                  <p className="text-muted-foreground">
                    Review your information before submitting for verification
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Once submitted, your documents will be reviewed by our team. This process typically takes 1-3 business days.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Entity Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{selectedEntityType?.replace(/_/g, ' ')}</p>
                    </CardContent>
                  </Card>

                  {directors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Directors/Shareholders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{directors.length} director(s) added</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{documents.length} document(s) uploaded</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep('documents')}>
                    Back
                  </Button>
                  <Button onClick={handleSubmitForReview} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit for Review'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  );
};

export default KYCVerificationPage;


import { ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import OrganizerLayout from './OrganizerLayout';
import { EntityTypeSelector } from '@/components/kyc/EntityTypeSelector';
import { DocumentUploadWizard } from '@/components/kyc/DocumentUploadWizard';
import { DirectorsForm } from '@/components/kyc/DirectorsForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';

type Step = 'entity-type' | 'additional-info' | 'directors' | 'documents' | 'review';

const INDUSTRY_OPTIONS = [
  { value: 'E_COMMERCE', label: 'E-Commerce' },
  { value: 'ENERGY_PETROLEUM', label: 'Energy/Petroleum' },
  { value: 'TOUR_OPERATOR', label: 'Tour Operator' },
  { value: 'PRIVATE_HOSPITAL', label: 'Private Hospital' },
  { value: 'PRIVATE_EDUCATION', label: 'Private Education' },
  // Add more as needed
];

const KYCVerificationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('entity-type');

  // Entity type selection
  const [selectedEntityType, setSelectedEntityType] = useState<OrganizerEntityType | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState({
    industry: '',
    businessName: '',
    registrationNumber: '',
  });

  // Requirements and data
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [directors, setDirectors] = useState<OrganizerDirector[]>([]);
  const [requiresDirectors, setRequiresDirectors] = useState(false);
  const [minDirectors, setMinDirectors] = useState<number | undefined>();

  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    try {
      setLoading(true);
      const [requirementsRes, documentsRes, directorsRes] = await Promise.all([
        getKYCRequirements(),
        getKYCDocuments().catch(() => ({ success: true, data: { documents: [], requirementsStatus: [], isComplete: false } })),
        getDirectors().catch(() => ({ success: true, data: { directors: [] } })),
      ]);

      if (requirementsRes.success && requirementsRes.data.entityType) {
        setSelectedEntityType(requirementsRes.data.entityType);
        setRequirements(requirementsRes.data.documents);
        setRequiresDirectors(requirementsRes.data.requiresDirectors);
        setMinDirectors(requirementsRes.data.minDirectors);
        
        // Set current step based on what's completed
        if (requirementsRes.data.entityType) {
          if (requirementsRes.data.requiresDirectors && directorsRes.success && directorsRes.data.directors.length === 0) {
            setCurrentStep('directors');
          } else if (documentsRes.success && !documentsRes.data.isComplete) {
            setCurrentStep('documents');
          } else {
            setCurrentStep('review');
          }
        }
      }

      if (documentsRes.success) {
        setDocuments(documentsRes.data.documents);
      }

      if (directorsRes.success) {
        setDirectors(directorsRes.data.directors);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load KYC data',
        description: error?.message || 'An error occurred',
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
      const requirementsRes = await getKYCRequirements();
      if (requirementsRes.success) {
        setRequirements(requirementsRes.data.documents);
        setRequiresDirectors(requirementsRes.data.requiresDirectors);
        setMinDirectors(requirementsRes.data.minDirectors);
        setCurrentStep('additional-info');
      }
    } catch (error: any) {
      toast({
        title: 'Failed to set entity type',
        description: error?.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleContinueFromAdditionalInfo = async () => {
    try {
      await setEntityType({
        entityType: selectedEntityType!,
        industry: additionalInfo.industry || undefined,
        businessName: additionalInfo.businessName || undefined,
        registrationNumber: additionalInfo.registrationNumber || undefined,
      });

      const requirementsRes = await getKYCRequirements();
      if (requirementsRes.success) {
        setRequirements(requirementsRes.data.documents);
        if (requirementsRes.data.requiresDirectors) {
          setCurrentStep('directors');
        } else {
          setCurrentStep('documents');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Failed to save information',
        description: error?.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDocumentUpload = async (data: {
    documentType: any;
    documentNumber?: string;
    documentUrl: string;
    issueDate?: string;
    expiryDate?: string;
  }) => {
    const result = await createKYCDocument(data);
    if (result.success) {
      await loadKYCData(); // Reload to get updated documents
    }
    return result;
  };

  const handleDocumentDelete = async (documentId: string) => {
    const result = await deleteKYCDocument(documentId);
    if (result.success) {
      await loadKYCData(); // Reload to get updated documents
    }
    return result;
  };

  const handleDirectorAdd = async (data: any) => {
    const result = await createDirector(data);
    if (result.success) {
      await loadKYCData(); // Reload to get updated directors
    }
    return result;
  };

  const handleDirectorDelete = async (directorId: string) => {
    const result = await deleteDirector(directorId);
    if (result.success) {
      await loadKYCData(); // Reload to get updated directors
    }
    return result;
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      const result = await submitKYCForReview();
      if (result.success) {
        toast({
          title: 'KYC submitted successfully',
          description: 'Your documents have been submitted for review. We will notify you once the review is complete.',
        });
        navigate('/organizer/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error?.message || 'An error occurred while submitting for review',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/organizer/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
          <p className="text-muted-foreground">
            Complete your identity verification to enable paid events and payouts
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(['entity-type', 'additional-info', 'directors', 'documents', 'review'] as Step[]).map((step, index) => {
              const isActive = step === currentStep;
              const isCompleted = ['entity-type', 'additional-info', 'directors', 'documents', 'review'].indexOf(currentStep) > index;
              
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
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className="mt-2 text-xs text-center capitalize">
                      {step.replace('-', ' ')}
                    </span>
                  </div>
                  {index < 4 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <Card>
          <CardContent className="pt-6">
            {currentStep === 'entity-type' && (
              <EntityTypeSelector
                selectedType={selectedEntityType}
                onSelect={handleEntityTypeSelect}
                onNext={() => {
                  // Check if entity type needs additional info
                  const needsInfo = selectedEntityType && (
                    selectedEntityType === OrganizerEntityType.LIMITED_LIABILITY_COMPANY ||
                    selectedEntityType === OrganizerEntityType.SOLE_PROPRIETOR
                  );
                  setCurrentStep(needsInfo ? 'additional-info' : requiresDirectors ? 'directors' : 'documents');
                }}
              />
            )}

            {currentStep === 'additional-info' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Additional Information</h2>
                  <p className="text-muted-foreground">
                    Provide additional information about your entity
                  </p>
                </div>

                <div className="space-y-4">
                  {requirements.some((r) => r.isConditional) && (
                    <div>
                      <Label htmlFor="industry">Industry (Optional)</Label>
                      <select
                        id="industry"
                        value={additionalInfo.industry}
                        onChange={(e) => setAdditionalInfo({ ...additionalInfo, industry: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select industry...</option>
                        {INDUSTRY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="businessName">Business/Trade Name (Optional)</Label>
                    <Input
                      id="businessName"
                      value={additionalInfo.businessName}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, businessName: e.target.value })}
                      placeholder="If different from registration name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="registrationNumber">Registration Number (Optional)</Label>
                    <Input
                      id="registrationNumber"
                      value={additionalInfo.registrationNumber}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, registrationNumber: e.target.value })}
                      placeholder="Business registration/incorporation number"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleContinueFromAdditionalInfo}>
                    Continue
                  </Button>
                </div>
              </div>
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
              <>
                <DocumentUploadWizard
                  requirements={requirements}
                  uploadedDocuments={documents}
                  onUpload={handleDocumentUpload}
                  onDelete={handleDocumentDelete}
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => {
                      // Check if documents are complete
                      const isComplete = requirements
                        .filter((r) => r.isRequired && !r.isConditional)
                        .every((r) => {
                          const uploaded = documents.filter((d) => d.documentType === r.documentType);
                          const approvedCount = uploaded.filter((d) => d.status === 'APPROVED').length;
                          return approvedCount >= r.minQuantity;
                        });
                      
                      if (isComplete) {
                        setCurrentStep('review');
                      } else {
                        toast({
                          title: 'Incomplete documents',
                          description: 'Please upload all required documents before proceeding',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Continue to Review
                  </Button>
                </div>
              </>
            )}

            {currentStep === 'review' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
                  <p className="text-muted-foreground">
                    Review your information before submitting for verification
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Once submitted, your documents will be reviewed by our team. This process typically takes 1-3 business days.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Entity Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{selectedEntityType?.replace(/_/g, ' ')}</p>
                    </CardContent>
                  </Card>

                  {directors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Directors/Shareholders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{directors.length} director(s) added</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{documents.length} document(s) uploaded</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCurrentStep('documents')}>
                    Back
                  </Button>
                  <Button onClick={handleSubmitForReview} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit for Review'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  );
};

export default KYCVerificationPage;

