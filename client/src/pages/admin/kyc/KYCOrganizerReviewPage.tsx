import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  Shield,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  Hash,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import {
  getOrganizerKYCDetails,
  approveKYCDocument,
  rejectKYCDocument,
  approveOrganizerKYC,
  rejectOrganizerKYC,
  type KYCOrganizerDetails,
  type KYCDocument,
} from '@/lib/admin-api';

export default function KYCOrganizerReviewPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<KYCOrganizerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null); // documentId or 'organizer'
  const [rejectError, setRejectError] = useState('');

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await getOrganizerKYCDetails(userId);
      if (res.success) setData(res.data);
    } catch (error) {
      console.error('Failed to load KYC details:', error);
      toast({ title: 'Error', description: 'Failed to load KYC details', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApproveDocument = async (documentId: string) => {
    setActionLoading(documentId);
    try {
      const res = await approveKYCDocument(documentId);
      if (res.success) {
        toast({ title: 'Document approved' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to approve document:', error);
      toast({ title: 'Error', description: 'Failed to approve document', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDocument = async (documentId: string) => {
    if (rejectReason.length < 10) {
      setRejectError('Reason must be at least 10 characters');
      return;
    }
    setActionLoading(documentId);
    try {
      const res = await rejectKYCDocument(documentId, rejectReason);
      if (res.success) {
        toast({ title: 'Document rejected' });
        setShowRejectModal(null);
        setRejectReason('');
        setRejectError('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to reject document:', error);
      toast({ title: 'Error', description: 'Failed to reject document', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveKYC = async () => {
    if (!userId) return;
    setActionLoading('approve-kyc');
    try {
      const res = await approveOrganizerKYC(userId);
      if (res.success) {
        toast({ title: 'KYC Approved', description: 'Organizer KYC has been approved successfully' });
        fetchData();
      }
    } catch (error: unknown) {
      const msg = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Failed to approve KYC';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectKYC = async () => {
    if (!userId) return;
    if (rejectReason.length < 10) {
      setRejectError('Reason must be at least 10 characters');
      return;
    }
    setActionLoading('reject-kyc');
    try {
      const res = await rejectOrganizerKYC(userId, rejectReason);
      if (res.success) {
        toast({ title: 'KYC Rejected' });
        setShowRejectModal(null);
        setRejectReason('');
        setRejectError('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      toast({ title: 'Error', description: 'Failed to reject KYC', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDocType = (type: string) =>
    type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const formatEntityType = (type: string | null) => {
    if (!type) return '—';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Check if all required docs are approved
  const allRequiredApproved = data?.requirementsStatus
    .filter((r) => r.isRequired)
    .every((r) => r.isComplete) ?? false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <Shield className="h-12 w-12 mb-4 opacity-30" />
        <p>KYC data not found</p>
        <Button variant="outline" onClick={() => navigate('/admin/kyc')} className="mt-4">
          Back to KYC Review
        </Button>
      </div>
    );
  }

  const { user: orgUser, documents, directors, requirementsStatus } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/kyc')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-page-title">KYC Review</h1>
          <p className="text-page-subtitle">
            {orgUser.firstName} {orgUser.lastName} — {orgUser.organizationName || orgUser.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orgUser.kycStatus && getStatusBadge(orgUser.kycStatus)}
        </div>
      </div>

      {/* Organizer Info */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Organizer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoField icon={User} label="Name" value={`${orgUser.firstName} ${orgUser.lastName}`} />
            <InfoField icon={Mail} label="Email" value={orgUser.email} />
            <InfoField icon={Phone} label="Phone" value={orgUser.phoneNumber || '—'} />
            <InfoField icon={Building2} label="Organization Name" value={orgUser.organizationName || '—'} />
            <InfoField icon={Building2} label="Company Affiliation" value={orgUser.companyAffiliation || '—'} />
            <InfoField icon={Mail} label="Business Email" value={orgUser.businessEmail || '—'} />
            <InfoField icon={Shield} label="Entity Type" value={formatEntityType(orgUser.entityType)} />
            <InfoField icon={Building2} label="Business Name" value={orgUser.businessName || '—'} />
            <InfoField icon={Globe} label="Country" value={orgUser.country} />
            <InfoField icon={Hash} label="Registration #" value={orgUser.registrationNumber || '—'} />
            <InfoField icon={FileText} label="Industry" value={orgUser.industry || '—'} />
          </div>
        </CardContent>
      </Card>

      {/* Directors / Shareholders */}
      {directors.length > 0 && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Directors / Shareholders ({directors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {directors.map((dir) => (
                <div
                  key={dir.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-muted/20"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{dir.fullName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{dir.nationality}</span>
                      <span>{dir.documentType}: {dir.documentNumber}</span>
                      {dir.kraPin && <span>KRA: {dir.kraPin}</span>}
                      {dir.sharePercentage != null && (
                        <span>{Number(dir.sharePercentage)}% shares</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dir.position && (
                      <Badge variant="outline" className="text-xs">{dir.position}</Badge>
                    )}
                    {dir.isTopFive && (
                      <Badge variant="secondary" className="text-xs">Top 5</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirements Checklist */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4" />
            Requirements Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requirementsStatus.map((req) => (
              <div
                key={req.documentType}
                className="flex items-center justify-between p-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {req.isComplete ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : req.pendingCount > 0 ? (
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm">{req.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.category} · Need {req.minQuantity}
                      {req.uploadedCount > 0 &&
                        ` · ${req.approvedCount} approved, ${req.pendingCount} pending, ${req.rejectedCount} rejected`}
                    </p>
                  </div>
                </div>
                {!req.isRequired && (
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No documents uploaded yet
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  isLoading={actionLoading === doc.id}
                  onApprove={() => handleApproveDocument(doc.id)}
                  onReject={() => {
                    setShowRejectModal(doc.id);
                    setRejectReason('');
                    setRejectError('');
                  }}
                  formatDocType={formatDocType}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Action Footer */}
      {orgUser.kycStatus === 'PENDING' && (
        <div className="rounded-2xl border border-border/40 bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Final KYC Decision</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {allRequiredApproved
                  ? 'All required documents are approved. You can approve the KYC.'
                  : 'Some required documents still need review before you can approve the KYC.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => {
                  setShowRejectModal('organizer');
                  setRejectReason('');
                  setRejectError('');
                }}
                disabled={actionLoading !== null}
              >
                <ShieldX className="h-4 w-4 mr-2" />
                Reject KYC
              </Button>
              <Button
                disabled={!allRequiredApproved || actionLoading !== null}
                onClick={handleApproveKYC}
              >
                {actionLoading === 'approve-kyc' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Approve KYC
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal (simple inline) */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-medium">
                {showRejectModal === 'organizer' ? 'Reject KYC' : 'Reject Document'}
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="rejectReason">Reason for rejection</Label>
                <Input
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError('');
                  }}
                  placeholder="Explain why this is being rejected (min 10 characters)..."
                  className="mt-1"
                />
                {rejectError && (
                  <p className="text-xs text-destructive mt-1">{rejectError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason('');
                    setRejectError('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={actionLoading !== null}
                  onClick={() => {
                    if (showRejectModal === 'organizer') {
                      handleRejectKYC();
                    } else {
                      handleRejectDocument(showRejectModal);
                    }
                  }}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function DocumentCard({
  document: doc,
  isLoading,
  onApprove,
  onReject,
  formatDocType,
  getStatusBadge,
}: {
  document: KYCDocument;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  formatDocType: (type: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">{formatDocType(doc.documentType)}</p>
          {doc.documentCategory && (
            <Badge variant="outline" className="text-xs mt-1">
              {doc.documentCategory}
            </Badge>
          )}
        </div>
        {getStatusBadge(doc.status)}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        {doc.documentNumber && (
          <div>
            <span className="font-medium">Number:</span> {doc.documentNumber}
          </div>
        )}
        {doc.issueDate && (
          <div>
            <span className="font-medium">Issued:</span>{' '}
            {new Date(doc.issueDate).toLocaleDateString()}
          </div>
        )}
        {doc.expiryDate && (
          <div>
            <span className="font-medium">Expires:</span>{' '}
            {new Date(doc.expiryDate).toLocaleDateString()}
          </div>
        )}
        <div>
          <span className="font-medium">Uploaded:</span>{' '}
          {new Date(doc.createdAt).toLocaleDateString()}
        </div>
      </div>

      {doc.documentUrl && (
        <a
          href={doc.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Download className="h-3.5 w-3.5" />
          View/Download Document
        </a>
      )}

      {doc.rejectionReason && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2">
          <p className="text-xs text-destructive">
            <strong>Rejection reason:</strong> {doc.rejectionReason}
          </p>
        </div>
      )}

      {doc.status === 'PENDING' && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            disabled={isLoading}
            onClick={onApprove}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5"
            disabled={isLoading}
            onClick={onReject}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
