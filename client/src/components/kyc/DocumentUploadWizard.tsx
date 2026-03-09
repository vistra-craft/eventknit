import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle2, FileText } from 'lucide-react';

import {
  type DocumentRequirement,
  type KYCDocument,
  KYCDocumentType,
} from '@/lib/organizer-api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/lib/utils/error';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

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

interface UploadState {
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  file?: File;
  preview?: string;
}

/* -------------------------------------------------------------------------- */
/*                                Constants                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

const groupByCategory = (requirements: DocumentRequirement[]) =>
  requirements.reduce<Record<string, DocumentRequirement[]>>((acc, req) => {
    acc[req.category] ??= [];
    acc[req.category].push(req);
    return acc;
  }, {});

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

export const DocumentUploadWizard: React.FC<DocumentUploadWizardProps> = ({
  requirements,
  uploadedDocuments,
  onUpload,
  onDelete,
  disabled = false,
}) => {
  const { toast } = useToast();

  const [uploading, setUploading] = useState<KYCDocumentType | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>(
    {}
  );
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const groupedRequirements = groupByCategory(requirements);

  const getUploadedForType = (documentType: KYCDocumentType) =>
    uploadedDocuments.filter((doc) => doc.documentType === documentType);

  const isRequirementComplete = (req: DocumentRequirement) =>
    getUploadedForType(req.documentType).filter(
      (doc) => doc.status === 'APPROVED' || doc.status === 'PENDING'
    ).length >= req.minQuantity;

  const isRequirementApproved = (req: DocumentRequirement) =>
    getUploadedForType(req.documentType).filter(
      (doc) => doc.status === 'APPROVED'
    ).length >= req.minQuantity;

  /* ---------------------------- File Handling ----------------------------- */

  const handleFileSelect = useCallback(
    (documentType: KYCDocumentType, file: File) => {
      if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image or PDF file',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum allowed size is 10MB',
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
    },
    [toast]
  );

  /* ----------------------------- Upload ---------------------------------- */

  const handleUpload = async (req: DocumentRequirement) => {
    const state = uploadStates[req.documentType];
    if (!state?.file || !state.preview) {
      toast({
        title: 'No file selected',
        description: 'Please select a file before uploading',
        variant: 'destructive',
      });
      return;
    }

    setUploading(req.documentType);

    try {
      await onUpload({
        documentType: req.documentType,
        documentNumber: state.documentNumber,
        documentUrl: state.preview,
        issueDate: state.issueDate,
        expiryDate: state.expiryDate,
      });

      setUploadStates((prev) => {
        const next = { ...prev };
        delete next[req.documentType];
        return next;
      });

      toast({
        title: 'Upload successful',
        description: `${req.description} uploaded successfully`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Upload failed',
        description: extractErrorMessage(error, 'Something went wrong'),
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  /* ----------------------------- Delete ---------------------------------- */

  const handleDelete = (documentId: string) => {
    if (!onDelete) return;
    setDeletingDocId(documentId);
  };

  const confirmDelete = async () => {
    if (!onDelete || !deletingDocId) return;
    const docId = deletingDocId;
    setDeletingDocId(null);

    try {
      await onDelete(docId);
      toast({ title: 'Document deleted' });
    } catch (error: unknown) {
      toast({
        title: 'Delete failed',
        description: extractErrorMessage(error, 'Something went wrong'),
        variant: 'destructive',
      });
    }
  };

  /* ----------------------------- Progress -------------------------------- */

  const required = requirements.filter(
    (r) => r.isRequired && !r.isConditional
  );

  const completed = required.filter(isRequirementComplete).length;
  const progress = required.length
    ? (completed / required.length) * 100
    : 0;

  /* ------------------------------ Render --------------------------------- */

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Required Documents</h2>
        <p className="text-muted-foreground mb-4">
          Upload all required documents. Ensure files are clear and legible.
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>
              {completed} of {required.length} completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {Object.entries(groupedRequirements).map(([category, reqs]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[category]}
              <CardTitle className="capitalize">{category}</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {reqs.map((req) => {
              const uploaded = getUploadedForType(req.documentType);
              const state = uploadStates[req.documentType];
              const isComplete = isRequirementComplete(req);
              const isApproved = isRequirementApproved(req);

              return (
                <div
                  key={req.documentType}
                  className="p-4 border rounded-lg space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">{req.description}</Label>
                    {req.isRequired && (
                      <Badge
                        variant={isApproved ? 'default' : isComplete ? 'secondary' : 'destructive'}
                      >
                        {isApproved ? 'Approved' : isComplete ? 'Pending Review' : 'Required'}
                      </Badge>
                    )}
                    {isApproved && (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                  </div>

                  {/* Uploaded docs */}
                  {uploaded.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex justify-between items-center p-2 bg-muted rounded"
                    >
                      <span className="text-sm">
                        {doc.documentNumber ?? 'Document'} —{' '}
                        <Badge>{doc.status}</Badge>
                      </span>

                      {onDelete && doc.status !== 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc.id)}
                          disabled={disabled}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Upload */}
                  {!isComplete && (
                    <>
                      <Input
                        placeholder="Document number (optional)"
                        value={state?.documentNumber ?? ''}
                        onChange={(e) =>
                          setUploadStates((prev) => ({
                            ...prev,
                            [req.documentType]: {
                              ...prev[req.documentType],
                              documentNumber: e.target.value,
                            },
                          }))
                        }
                        disabled={disabled}
                      />

                      <input
                        type="file"
                        accept="image/*,.pdf"
                        hidden
                        id={`file-${req.documentType}`}
                        onChange={(e) =>
                          e.target.files &&
                          handleFileSelect(
                            req.documentType,
                            e.target.files[0]
                          )
                        }
                      />

                      <label htmlFor={`file-${req.documentType}`}>
                        <div className="p-4 border-dashed border rounded cursor-pointer flex gap-2 items-center">
                          <Upload className="w-4 h-4" />
                          <span>
                            {state?.file?.name ??
                              'Click to select a file'}
                          </span>
                        </div>
                      </label>

                      <Button
                        onClick={() => handleUpload(req)}
                        disabled={!state?.file || uploading === req.documentType}
                      >
                        {uploading === req.documentType
                          ? 'Uploading...'
                          : 'Upload'}
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Delete Document Confirmation */}
      <AlertDialog open={!!deletingDocId} onOpenChange={(open) => !open && setDeletingDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? You will need to upload it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
