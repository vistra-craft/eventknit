import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileText, Calendar, Info } from 'lucide-react';
import { DocumentRequirement, KYCDocument, KYCDocumentType } from '@/lib/organizer-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadWizardProps {
  requirements: DocumentRequirement[];
  uploadedDocuments: KYCDocument[];
  onUpload: (data: {
    documentType: KYCDocumentType;
    documentNumber?: string;
    documentUrl: string;
    issueDate?: string;
    expiryDate?: string;
  }) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  disabled?: boolean;
}

// Category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  contract: <FileText className="w-4 h-4" />,
  identity: <FileText className="w-4 h-4" />,
  registration: <FileText className="w-4 h-4" />,
  financial: <FileText className="w-4 h-4" />,
  authorization: <FileText className="w-4 h-4" />,
  industry: <FileText className="w-4 h-4" />,
  organization: <FileText className="w-4 h-4" />,
  special: <FileText className="w-4 h-4" />,
};

// Group documents by category
const groupByCategory = (requirements: DocumentRequirement[]) => {
  const groups: Record<string, DocumentRequirement[]> = {};
  requirements.forEach((req) => {
    if (!groups[req.category]) {
      groups[req.category] = [];
    }
    groups[req.category].push(req);
  });
  return groups;
};

export const DocumentUploadWizard: React.FC<DocumentUploadWizardProps> = ({
  requirements,
  uploadedDocuments,
  onUpload,
  onDelete,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null); // documentType being uploaded
  const [uploadStates, setUploadStates] = useState<Record<string, {
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    file?: File;
    preview?: string;
  }>>({});

  const groupedRequirements = groupByCategory(requirements);

  // Get uploaded documents for a specific type
  const getUploadedForType = (documentType: KYCDocumentType) => {
    return uploadedDocuments.filter((doc) => doc.documentType === documentType);
  };

  // Check if requirement is complete
  const isRequirementComplete = (req: DocumentRequirement) => {
    const uploaded = getUploadedForType(req.documentType);
    const approvedCount = uploaded.filter((doc) => doc.status === 'APPROVED').length;
    return approvedCount >= req.minQuantity;
  };

  // Check if requirement has minimum
  const hasMinimum = (req: DocumentRequirement) => {
    const uploaded = getUploadedForType(req.documentType);
    return uploaded.length >= req.minQuantity;
  };

  const handleFileSelect = useCallback((documentType: KYCDocumentType, file: File) => {
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image (JPG, PNG) or PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadStates((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          file,
          preview: reader.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleUpload = async (req: DocumentRequirement) => {
    const state = uploadStates[req.documentType];
    if (!state?.file || !state.preview) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(req.documentType);
    try {
      await onUpload({
        documentType: req.documentType,
        documentNumber: state.documentNumber,
        documentUrl: state.preview, // Base64 data URL
        issueDate: state.issueDate,
        expiryDate: state.expiryDate,
      });

      // Clear upload state
      setUploadStates((prev) => {
        const next = { ...prev };
        delete next[req.documentType];
        return next;
      });

      toast({
        title: 'Document uploaded',
        description: `${req.description} has been uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error?.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!onDelete || !confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await onDelete(documentId);
      toast({
        title: 'Document deleted',
        description: 'Document has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.message || 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  // Calculate overall progress
  const totalRequired = requirements.filter((r) => r.isRequired && !r.isConditional).length;
  const completedRequired = requirements.filter(
    (r) => r.isRequired && !r.isConditional && isRequirementComplete(r)
  ).length;
  const progress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Required Documents</h2>
        <p className="text-muted-foreground mb-4">
          Upload the documents required for your entity type. All documents must be clear and legible.
        </p>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Document Progress</span>
            <span>{completedRequired} of {totalRequired} required documents completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Grouped by category */}
      {Object.entries(groupedRequirements).map(([category, categoryReqs]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[category]}
              <CardTitle className="capitalize">{category}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryReqs.map((req) => {
              const uploaded = getUploadedForType(req.documentType);
              const isComplete = isRequirementComplete(req);
              const hasMin = hasMinimum(req);
              const state = uploadStates[req.documentType];

              return (
                <div key={req.documentType} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="font-semibold">{req.description}</Label>
                        {req.isRequired && (
                          <Badge variant={isComplete ? 'default' : 'destructive'}>
                            Required
                          </Badge>
                        )}
                        {req.isConditional && (
                          <Badge variant="secondary">Conditional</Badge>
                        )}
                        {isComplete && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>

                      {req.helpText && (
                        <p className="text-sm text-muted-foreground mb-2">{req.helpText}</p>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {req.validityPeriodDays && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Valid for {req.validityPeriodDays} days
                          </span>
                        )}
                        <span>
                          {uploaded.filter((d) => d.status === 'APPROVED').length} / {req.minQuantity} uploaded
                          {req.maxQuantity && ` (max ${req.maxQuantity})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded documents list */}
                  {uploaded.length > 0 && (
                    <div className="space-y-2">
                      {uploaded.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">
                              {doc.documentNumber || 'Document'} -{' '}
                              <Badge variant={doc.status === 'APPROVED' ? 'default' : doc.status === 'PENDING' ? 'secondary' : 'destructive'}>
                                {doc.status}
                              </Badge>
                            </span>
                          </div>
                          {onDelete && doc.status !== 'APPROVED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                              disabled={disabled}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload form */}
                  {(!hasMin || !isComplete) && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Document Number (Optional)</Label>
                          <Input
                            placeholder="Enter document number if applicable"
                            value={state?.documentNumber || ''}
                            onChange={(e) =>
                              setUploadStates((prev) => ({
                                ...prev,
                                [req.documentType]: { ...prev[req.documentType], documentNumber: e.target.value },
                              }))
                            }
                            disabled={disabled || uploading === req.documentType}
                          />
                        </div>
                        {req.validityPeriodDays && (
                          <>
                            <div>
                              <Label>Issue Date (Optional)</Label>
                              <Input
                                type="date"
                                value={state?.issueDate || ''}
                                onChange={(e) =>
                                  setUploadStates((prev) => ({
                                    ...prev,
                                    [req.documentType]: { ...prev[req.documentType], issueDate: e.target.value },
                                  }))
                                }
                                disabled={disabled || uploading === req.documentType}
                              />
                            </div>
                            <div>
                              <Label>Expiry Date (Optional)</Label>
                              <Input
                                type="date"
                                value={state?.expiryDate || ''}
                                onChange={(e) =>
                                  setUploadStates((prev) => ({
                                    ...prev,
                                    [req.documentType]: { ...prev[req.documentType], expiryDate: e.target.value },
                                  }))
                                }
                                disabled={disabled || uploading === req.documentType}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <Label>Upload File</Label>
                        <div className="mt-1">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileSelect(req.documentType, file);
                              }
                            }}
                            disabled={disabled || uploading === req.documentType}
                            className="hidden"
                            id={`file-${req.documentType}`}
                          />
                          <label htmlFor={`file-${req.documentType}`}>
                            <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="w-5 h-5" />
                              <span className="text-sm">
                                {state?.file ? state.file.name : 'Click to upload or drag and drop'}
                              </span>
                            </div>
                          </label>
                          {state?.preview && (
                            <div className="mt-2 relative inline-block">
                              <img
                                src={state.preview}
                                alt="Preview"
                                className="max-w-xs max-h-48 rounded border"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleUpload(req)}
                        disabled={disabled || uploading === req.documentType || !state?.file}
                      >
                        {uploading === req.documentType ? 'Uploading...' : 'Upload Document'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


import { Upload, X, CheckCircle2, AlertCircle, FileText, Calendar, Info } from 'lucide-react';
import { DocumentRequirement, KYCDocument, KYCDocumentType } from '@/lib/organizer-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadWizardProps {
  requirements: DocumentRequirement[];
  uploadedDocuments: KYCDocument[];
  onUpload: (data: {
    documentType: KYCDocumentType;
    documentNumber?: string;
    documentUrl: string;
    issueDate?: string;
    expiryDate?: string;
  }) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  disabled?: boolean;
}

// Category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  contract: <FileText className="w-4 h-4" />,
  identity: <FileText className="w-4 h-4" />,
  registration: <FileText className="w-4 h-4" />,
  financial: <FileText className="w-4 h-4" />,
  authorization: <FileText className="w-4 h-4" />,
  industry: <FileText className="w-4 h-4" />,
  organization: <FileText className="w-4 h-4" />,
  special: <FileText className="w-4 h-4" />,
};

// Group documents by category
const groupByCategory = (requirements: DocumentRequirement[]) => {
  const groups: Record<string, DocumentRequirement[]> = {};
  requirements.forEach((req) => {
    if (!groups[req.category]) {
      groups[req.category] = [];
    }
    groups[req.category].push(req);
  });
  return groups;
};

export const DocumentUploadWizard: React.FC<DocumentUploadWizardProps> = ({
  requirements,
  uploadedDocuments,
  onUpload,
  onDelete,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null); // documentType being uploaded
  const [uploadStates, setUploadStates] = useState<Record<string, {
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    file?: File;
    preview?: string;
  }>>({});

  const groupedRequirements = groupByCategory(requirements);

  // Get uploaded documents for a specific type
  const getUploadedForType = (documentType: KYCDocumentType) => {
    return uploadedDocuments.filter((doc) => doc.documentType === documentType);
  };

  // Check if requirement is complete
  const isRequirementComplete = (req: DocumentRequirement) => {
    const uploaded = getUploadedForType(req.documentType);
    const approvedCount = uploaded.filter((doc) => doc.status === 'APPROVED').length;
    return approvedCount >= req.minQuantity;
  };

  // Check if requirement has minimum
  const hasMinimum = (req: DocumentRequirement) => {
    const uploaded = getUploadedForType(req.documentType);
    return uploaded.length >= req.minQuantity;
  };

  const handleFileSelect = useCallback((documentType: KYCDocumentType, file: File) => {
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image (JPG, PNG) or PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadStates((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          file,
          preview: reader.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleUpload = async (req: DocumentRequirement) => {
    const state = uploadStates[req.documentType];
    if (!state?.file || !state.preview) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(req.documentType);
    try {
      await onUpload({
        documentType: req.documentType,
        documentNumber: state.documentNumber,
        documentUrl: state.preview, // Base64 data URL
        issueDate: state.issueDate,
        expiryDate: state.expiryDate,
      });

      // Clear upload state
      setUploadStates((prev) => {
        const next = { ...prev };
        delete next[req.documentType];
        return next;
      });

      toast({
        title: 'Document uploaded',
        description: `${req.description} has been uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error?.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!onDelete || !confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await onDelete(documentId);
      toast({
        title: 'Document deleted',
        description: 'Document has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.message || 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  // Calculate overall progress
  const totalRequired = requirements.filter((r) => r.isRequired && !r.isConditional).length;
  const completedRequired = requirements.filter(
    (r) => r.isRequired && !r.isConditional && isRequirementComplete(r)
  ).length;
  const progress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Required Documents</h2>
        <p className="text-muted-foreground mb-4">
          Upload the documents required for your entity type. All documents must be clear and legible.
        </p>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Document Progress</span>
            <span>{completedRequired} of {totalRequired} required documents completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Grouped by category */}
      {Object.entries(groupedRequirements).map(([category, categoryReqs]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[category]}
              <CardTitle className="capitalize">{category}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryReqs.map((req) => {
              const uploaded = getUploadedForType(req.documentType);
              const isComplete = isRequirementComplete(req);
              const hasMin = hasMinimum(req);
              const state = uploadStates[req.documentType];

              return (
                <div key={req.documentType} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="font-semibold">{req.description}</Label>
                        {req.isRequired && (
                          <Badge variant={isComplete ? 'default' : 'destructive'}>
                            Required
                          </Badge>
                        )}
                        {req.isConditional && (
                          <Badge variant="secondary">Conditional</Badge>
                        )}
                        {isComplete && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>

                      {req.helpText && (
                        <p className="text-sm text-muted-foreground mb-2">{req.helpText}</p>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {req.validityPeriodDays && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Valid for {req.validityPeriodDays} days
                          </span>
                        )}
                        <span>
                          {uploaded.filter((d) => d.status === 'APPROVED').length} / {req.minQuantity} uploaded
                          {req.maxQuantity && ` (max ${req.maxQuantity})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded documents list */}
                  {uploaded.length > 0 && (
                    <div className="space-y-2">
                      {uploaded.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">
                              {doc.documentNumber || 'Document'} -{' '}
                              <Badge variant={doc.status === 'APPROVED' ? 'default' : doc.status === 'PENDING' ? 'secondary' : 'destructive'}>
                                {doc.status}
                              </Badge>
                            </span>
                          </div>
                          {onDelete && doc.status !== 'APPROVED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                              disabled={disabled}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload form */}
                  {(!hasMin || !isComplete) && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Document Number (Optional)</Label>
                          <Input
                            placeholder="Enter document number if applicable"
                            value={state?.documentNumber || ''}
                            onChange={(e) =>
                              setUploadStates((prev) => ({
                                ...prev,
                                [req.documentType]: { ...prev[req.documentType], documentNumber: e.target.value },
                              }))
                            }
                            disabled={disabled || uploading === req.documentType}
                          />
                        </div>
                        {req.validityPeriodDays && (
                          <>
                            <div>
                              <Label>Issue Date (Optional)</Label>
                              <Input
                                type="date"
                                value={state?.issueDate || ''}
                                onChange={(e) =>
                                  setUploadStates((prev) => ({
                                    ...prev,
                                    [req.documentType]: { ...prev[req.documentType], issueDate: e.target.value },
                                  }))
                                }
                                disabled={disabled || uploading === req.documentType}
                              />
                            </div>
                            <div>
                              <Label>Expiry Date (Optional)</Label>
                              <Input
                                type="date"
                                value={state?.expiryDate || ''}
                                onChange={(e) =>
                                  setUploadStates((prev) => ({
                                    ...prev,
                                    [req.documentType]: { ...prev[req.documentType], expiryDate: e.target.value },
                                  }))
                                }
                                disabled={disabled || uploading === req.documentType}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <Label>Upload File</Label>
                        <div className="mt-1">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileSelect(req.documentType, file);
                              }
                            }}
                            disabled={disabled || uploading === req.documentType}
                            className="hidden"
                            id={`file-${req.documentType}`}
                          />
                          <label htmlFor={`file-${req.documentType}`}>
                            <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <Upload className="w-5 h-5" />
                              <span className="text-sm">
                                {state?.file ? state.file.name : 'Click to upload or drag and drop'}
                              </span>
                            </div>
                          </label>
                          {state?.preview && (
                            <div className="mt-2 relative inline-block">
                              <img
                                src={state.preview}
                                alt="Preview"
                                className="max-w-xs max-h-48 rounded border"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleUpload(req)}
                        disabled={disabled || uploading === req.documentType || !state?.file}
                      >
                        {uploading === req.documentType ? 'Uploading...' : 'Upload Document'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


