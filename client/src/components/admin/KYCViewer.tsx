import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Users,
} from 'lucide-react';
import type { KYCOrganizerDetails, KYCDocument } from '../../lib/admin-api';

interface KYCViewerProps {
  organizer: KYCOrganizerDetails;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onRequestMoreInfo?: (message: string, missingDocuments: string[]) => void;
  isLoading?: boolean;
}

const getEntityTypeLabel = (entityType: string | null): string => {
  if (!entityType) return 'Not specified';
  const labels: Record<string, string> = {
    INDIVIDUAL: 'Individual',
    SOLE_PROPRIETOR: 'Sole Proprietor',
    PARTNERSHIP: 'Partnership',
    COMPANY: 'Company',
    PRIVATE_LIMITED_COMPANY: 'Private Limited Company',
    PUBLIC_LIMITED_COMPANY: 'Public Limited Company',
    NON_PROFIT: 'Non-Profit',
    COOPERATIVE: 'Cooperative',
  };
  return labels[entityType] || entityType;
};

const getDocumentStatusColor = (status: string): string => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-50 border-green-200';
    case 'REJECTED':
      return 'bg-red-50 border-red-200';
    case 'PENDING':
      return 'bg-yellow-50 border-yellow-200';
    default:
      return 'bg-gray-50';
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    case 'PENDING':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const KYCViewer = ({
  organizer,
  onApprove,
  onReject,
  onRequestMoreInfo,
  isLoading = false,
}: KYCViewerProps) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [requestInfoDialogOpen, setRequestInfoDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedMissingDocs, setSelectedMissingDocs] = useState<string[]>([]);
  const [requestMessage, setRequestMessage] = useState('');

  // Group documents by category
  const documentsByCategory = organizer.documents.reduce(
    (acc, doc) => {
      const category = doc.documentCategory || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(doc);
      return acc;
    },
    {} as Record<string, KYCDocument[]>
  );

  // Calculate KYC completion status
  const totalDocuments = organizer.requirementsStatus.length;
  const completeDocuments = organizer.requirementsStatus.filter((req) => req.isComplete).length;
  const completionPercentage = Math.round((completeDocuments / totalDocuments) * 100);

  const handleRejectKYC = () => {
    if (onReject && rejectReason.trim()) {
      onReject(rejectReason);
      setRejectDialogOpen(false);
      setRejectReason('');
    }
  };

  const handleRequestMoreInfo = () => {
    if (onRequestMoreInfo && (requestMessage.trim() || selectedMissingDocs.length > 0)) {
      onRequestMoreInfo(requestMessage, selectedMissingDocs);
      setRequestInfoDialogOpen(false);
      setRequestMessage('');
      setSelectedMissingDocs([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with KYC Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">KYC Verification</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {getEntityTypeLabel(organizer.user.entityType)} • Submitted{' '}
            {organizer.user.submittedAt
              ? new Date(organizer.user.submittedAt).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
        <Badge
          variant={getStatusBadgeVariant(organizer.user.kycStatus || 'PENDING')}
          className="text-base px-3 py-1"
        >
          {organizer.user.kycStatus || 'PENDING'}
        </Badge>
      </div>

      {/* Organizer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organizer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">
                {organizer.user.firstName} {organizer.user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{organizer.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold">{organizer.user.phoneNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entity Type</p>
              <p className="font-semibold">{getEntityTypeLabel(organizer.user.entityType)}</p>
            </div>
            {organizer.user.organizationName && (
              <div>
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="font-semibold">{organizer.user.organizationName}</p>
              </div>
            )}
            {organizer.user.businessName && (
              <div>
                <p className="text-sm text-muted-foreground">Business Name</p>
                <p className="font-semibold">{organizer.user.businessName}</p>
              </div>
            )}
            {organizer.user.registrationNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Registration Number</p>
                <p className="font-semibold">{organizer.user.registrationNumber}</p>
              </div>
            )}
            {organizer.user.industry && (
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-semibold">{organizer.user.industry}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KYC Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Completion Status</CardTitle>
          <CardDescription>
            {completeDocuments} of {totalDocuments} document types submitted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {completionPercentage}% complete • {totalDocuments - completeDocuments} missing
          </p>
        </CardContent>
      </Card>

      {/* Requirements Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {organizer.requirementsStatus.map((req) => (
              <div key={req.documentType} className="flex items-start justify-between p-3 bg-secondary rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{req.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Category: {req.category || 'General'}
                    {req.isRequired ? <span className="ml-2 text-red-600">• Required</span> : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <div className="flex gap-2 justify-end text-xs">
                      <span className="text-green-600">✓ {req.approvedCount}</span>
                      <span className="text-yellow-600">⏱ {req.pendingCount}</span>
                      <span className="text-red-600">✗ {req.rejectedCount}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {req.uploadedCount} of {req.minQuantity} uploaded
                    </p>
                  </div>
                  {req.isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submitted Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(documentsByCategory).length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No documents submitted yet</AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue={Object.keys(documentsByCategory)[0]}>
              <TabsList className="grid w-full grid-cols-4">
                {Object.keys(documentsByCategory).map((category) => (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {category.replace('_', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(documentsByCategory).map(([category, docs]) => (
                <TabsContent key={category} value={category} className="space-y-3 mt-4">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`border rounded-lg p-4 space-y-3 ${getDocumentStatusColor(
                        doc.status
                      )}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{doc.documentType}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.documentNumber || 'No document number'}
                            </p>
                            {doc.isRequired && (
                              <Badge className="mt-2 text-xs" variant="outline">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(doc.status)}>
                          {doc.status}
                        </Badge>
                      </div>

                      {/* Document Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {doc.issueDate && (
                          <div>
                            <span className="text-muted-foreground">Issue Date:</span>
                            <p className="font-medium">
                              {new Date(doc.issueDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {doc.expiryDate && (
                          <div>
                            <span className="text-muted-foreground">Expiry Date:</span>
                            <p
                              className={`font-medium ${
                                new Date(doc.expiryDate) < new Date()
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {new Date(doc.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Rejection Reason */}
                      {doc.rejectionReason && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{doc.rejectionReason}</AlertDescription>
                        </Alert>
                      )}

                      {/* Document Actions */}
                      <div className="flex items-center gap-2">
                        {doc.documentUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => doc.documentUrl && window.open(doc.documentUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        )}
                        {doc.documentUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.documentUrl || '#';
                              link.download = `${doc.documentType}-${doc.id}`;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Directors/Shareholders (if applicable) */}
      {organizer.directors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Directors & Shareholders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organizer.directors.map((director) => (
                <div
                  key={director.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{director.fullName}</p>
                      {director.position && (
                        <p className="text-sm text-muted-foreground">{director.position}</p>
                      )}
                    </div>
                    {director.isTopFive && (
                      <Badge variant="outline" className="bg-blue-50">
                        Top 5
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nationality</p>
                      <p className="font-medium">{director.nationality}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">DOB</p>
                      <p className="font-medium">
                        {new Date(director.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ID Type</p>
                      <p className="font-medium">{director.documentType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ID Number</p>
                      <p className="font-medium">{director.documentNumber}</p>
                    </div>
                    {director.sharePercentage !== null && (
                      <div>
                        <p className="text-muted-foreground">Share %</p>
                        <p className="font-medium">{director.sharePercentage}%</p>
                      </div>
                    )}
                    {director.kraPin && (
                      <div>
                        <p className="text-muted-foreground">KRA PIN</p>
                        <p className="font-medium">{director.kraPin}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {organizer.user.kycStatus !== 'APPROVED' && (
        <div className="flex gap-3 pt-4">
          <Button
            variant="default"
            onClick={onApprove}
            disabled={isLoading || completeDocuments < totalDocuments}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : 'Approve KYC'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setRequestInfoDialogOpen(true)}
            disabled={isLoading}
          >
            Request More Info
          </Button>
          <Button
            variant="destructive"
            onClick={() => setRejectDialogOpen(true)}
            disabled={isLoading}
          >
            Reject
          </Button>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Submission</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this KYC submission. The organizer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Explain why the KYC submission is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectKYC}
              disabled={!rejectReason.trim()}
            >
              Reject KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request More Information Dialog */}
      <Dialog open={requestInfoDialogOpen} onOpenChange={setRequestInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request More Information</DialogTitle>
            <DialogDescription>
              Ask the organizer to provide additional documents or information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Describe what additional information or documents are needed..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Missing Documents (Optional)</label>
              <p className="text-xs text-muted-foreground mb-3">
                Select which documents are missing or need to be resubmitted
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {organizer.requirementsStatus
                  .filter((req) => !req.isComplete)
                  .map((req) => (
                    <label
                      key={req.documentType}
                      className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMissingDocs.includes(req.documentType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMissingDocs([...selectedMissingDocs, req.documentType]);
                          } else {
                            setSelectedMissingDocs(
                              selectedMissingDocs.filter((d) => d !== req.documentType)
                            );
                          }
                        }}
                      />
                      <span className="text-sm">{req.description}</span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRequestInfoDialogOpen(false);
                setRequestMessage('');
                setSelectedMissingDocs([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestMoreInfo}
              disabled={!requestMessage.trim() && selectedMissingDocs.length === 0}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KYCViewer;
