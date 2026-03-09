/**
 * Attendee Import Dialog
 * Multi-step dialog for bulk importing attendees from CSV/Excel
 */

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Loader } from "@/components/ui/loader";
import {
  validateImportFile,
  executeImport,
  downloadImportTemplate,
  type ValidationResult,
  type ImportResult,
} from '@/lib/attendee-import-api';
import { extractErrorMessage } from '@/lib/utils/error';

interface AttendeeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onImportComplete?: () => void;
}

type ImportStep = 'upload' | 'preview' | 'options' | 'progress' | 'complete';

export function AttendeeImportDialog({
  open,
  onOpenChange,
  eventId,
  onImportComplete,
}: AttendeeImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import options
  const [sendWelcomeEmails, setSendWelcomeEmails] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
    setError(null);
    setSendWelcomeEmails(false);
    setSkipDuplicates(true);
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, resetState]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      await downloadImportTemplate(eventId);
    } catch {
      setError('Failed to download template');
    }
  }, [eventId]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    try {
      const result = await validateImportFile(eventId, selectedFile);
      setValidationResult(result);
      setStep('preview');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to validate file'));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setStep('progress');
    setIsLoading(true);
    setError(null);

    try {
      const result = await executeImport(eventId, file, {
        sendWelcomeEmails,
        skipDuplicates,
      });
      setImportResult(result);
      setStep('complete');
      onImportComplete?.();
    } catch (err) {
      setError(extractErrorMessage(err, 'Import failed'));
      setStep('options');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, file, sendWelcomeEmails, skipDuplicates, onImportComplete]);

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader size="lg" />
            <p className="text-sm text-muted-foreground">Validating file...</p>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Drop your file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports CSV and Excel (.xlsx, .xls) files up to 5MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileSpreadsheet className="h-4 w-4" />
          CSV or Excel file
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!validationResult) return null;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{validationResult.totalRows}</p>
            <p className="text-xs text-muted-foreground">Total Rows</p>
          </div>
          <div className="text-center p-3 bg-success/5 rounded-lg">
            <p className="text-2xl font-bold text-success">{validationResult.validRows}</p>
            <p className="text-xs text-muted-foreground">Valid</p>
          </div>
          <div className="text-center p-3 bg-destructive/5 rounded-lg">
            <p className="text-2xl font-bold text-destructive">{validationResult.errorRows}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>

        {/* Preview Table */}
        {validationResult.preview.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">First Name</th>
                    <th className="px-3 py-2 text-left">Last Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResult.preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{row.firstName}</td>
                      <td className="px-3 py-2">{row.lastName}</td>
                      <td className="px-3 py-2">{row.email}</td>
                      <td className="px-3 py-2">{row.ticketType || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {validationResult.preview.length > 5 && (
              <div className="px-3 py-2 text-center text-xs text-muted-foreground bg-muted">
                Showing 5 of {validationResult.totalRows} rows
              </div>
            )}
          </div>
        )}

        {/* Errors */}
        {validationResult.errors.length > 0 && (
          <div className="border border-destructive rounded-lg p-3 bg-destructive/5">
            <p className="text-sm font-medium text-destructive mb-2">
              Validation Errors ({validationResult.errors.length})
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {validationResult.errors.slice(0, 10).map((err, i) => (
                <p key={i} className="text-xs text-destructive">
                  Row {err.row}: {err.field} - {err.message}
                </p>
              ))}
              {validationResult.errors.length > 10 && (
                <p className="text-xs text-destructive font-medium">
                  ...and {validationResult.errors.length - 10} more errors
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOptionsStep = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="skipDuplicates"
            checked={skipDuplicates}
            onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
          />
          <Label htmlFor="skipDuplicates" className="text-sm">
            Skip duplicate registrations (recommended)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendWelcomeEmails"
            checked={sendWelcomeEmails}
            onCheckedChange={(checked) => setSendWelcomeEmails(checked === true)}
          />
          <Label htmlFor="sendWelcomeEmails" className="text-sm">
            Send welcome emails to imported attendees
          </Label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm font-medium">Ready to import</p>
        <p className="text-xs text-muted-foreground mt-1">
          {validationResult?.validRows || 0} attendees will be imported from {file?.name}
        </p>
      </div>
    </div>
  );

  const renderProgressStep = () => (
    <div className="space-y-4 py-4">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        <div className="text-center">
          <p className="font-medium">Importing attendees...</p>
          <p className="text-sm text-muted-foreground mt-1">
            This may take a moment for large files
          </p>
        </div>
      </div>
      <Progress value={undefined} className="w-full" />
    </div>
  );

  const renderCompleteStep = () => {
    if (!importResult) return null;

    const isSuccess = importResult.errorCount === 0;

    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          {isSuccess ? (
            <CheckCircle className="h-12 w-12 text-success" />
          ) : (
            <AlertCircle className="h-12 w-12 text-warning" />
          )}
          <div className="text-center">
            <p className="font-medium">
              {isSuccess ? 'Import Complete!' : 'Import Completed with Errors'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {importResult.successCount} of {importResult.totalRows} attendees imported successfully
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-success/5 rounded-lg">
            <p className="text-2xl font-bold text-success">{importResult.successCount}</p>
            <p className="text-xs text-muted-foreground">Imported</p>
          </div>
          <div className="text-center p-3 bg-destructive/5 rounded-lg">
            <p className="text-2xl font-bold text-destructive">{importResult.errorCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Error Details */}
        {importResult.errors.length > 0 && (
          <div className="border border-destructive rounded-lg p-3 bg-destructive/5">
            <p className="text-sm font-medium text-destructive mb-2">
              Failed Imports ({importResult.errors.length})
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {importResult.errors.slice(0, 10).map((err, i) => (
                <p key={i} className="text-xs text-destructive">
                  Row {err.row}: {err.message}
                </p>
              ))}
              {importResult.errors.length > 10 && (
                <p className="text-xs text-destructive font-medium">
                  ...and {importResult.errors.length - 10} more errors
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getStepContent = () => {
    switch (step) {
      case 'upload':
        return renderUploadStep();
      case 'preview':
        return renderPreviewStep();
      case 'options':
        return renderOptionsStep();
      case 'progress':
        return renderProgressStep();
      case 'complete':
        return renderCompleteStep();
    }
  };

  const getDialogTitle = () => {
    switch (step) {
      case 'upload':
        return 'Import Attendees';
      case 'preview':
        return 'Preview Import';
      case 'options':
        return 'Import Options';
      case 'progress':
        return 'Importing...';
      case 'complete':
        return 'Import Results';
    }
  };

  const getDialogDescription = () => {
    switch (step) {
      case 'upload':
        return 'Upload a CSV or Excel file with attendee information';
      case 'preview':
        return 'Review the data before importing';
      case 'options':
        return 'Configure import settings';
      case 'progress':
        return 'Please wait while we import your attendees';
      case 'complete':
        return 'Your import has been processed';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        {getStepContent()}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Back
              </Button>
              <Button
                onClick={() => setStep('options')}
                disabled={!validationResult?.isValid && validationResult?.errorRows === validationResult?.totalRows}
              >
                Continue ({validationResult?.validRows || 0} valid)
              </Button>
            </>
          )}

          {step === 'options' && (
            <>
              <Button variant="outline" onClick={() => setStep('preview')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Importing...
                  </>
                ) : (
                  <>Import {validationResult?.validRows || 0} Attendees</>
                )}
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
