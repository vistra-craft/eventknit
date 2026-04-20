import { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getAllBrandings,
  updateBrandingStatus,
  type WhiteLabelBranding,
  type OrganizerInfo,
} from '@/lib/white-label-api';
import {
  Search,
  Eye,
  Check,
  X,
  Palette,
  Mail,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';

type BrandingWithOrg = WhiteLabelBranding & { organizer?: OrganizerInfo };

interface BrandingTabProps {
  onEditBranding: (branding: BrandingWithOrg) => void;
  refreshKey: number;
}

const BrandingTab = ({ onEditBranding, refreshKey }: BrandingTabProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [brandings, setBrandings] = useState<BrandingWithOrg[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranding, setSelectedBranding] = useState<BrandingWithOrg | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadBrandings = useCallback(async () => {
    try {
      setIsLoading(true);
      const status =
        activeTab === 'pending'
          ? 'PENDING_APPROVAL'
          : activeTab === 'active'
            ? 'ACTIVE'
            : undefined;
      const res = await getAllBrandings({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: status as any,
        search: searchTerm || undefined,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBrandings((res as any)?.data || res || []);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load brandings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm, toast]);

  useEffect(() => {
    loadBrandings();
  }, [loadBrandings, refreshKey]);

  const handleApprove = async (brandingId: string) => {
    try {
      setProcessingId(brandingId);
      await updateBrandingStatus(brandingId, 'ACTIVE');
      toast({ title: 'Success', description: 'Branding approved and activated' });
      loadBrandings();
    } catch {
      toast({ title: 'Error', description: 'Failed to approve branding', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBranding) return;
    try {
      setProcessingId(selectedBranding.id);
      await updateBrandingStatus(selectedBranding.id, 'INACTIVE', rejectionReason);
      toast({ title: 'Success', description: 'Branding rejected' });
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedBranding(null);
      loadBrandings();
    } catch {
      toast({ title: 'Error', description: 'Failed to reject branding', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      ACTIVE: { variant: 'default', label: 'Active' },
      PENDING_APPROVAL: { variant: 'secondary', label: 'Pending' },
      INACTIVE: { variant: 'destructive', label: 'Rejected' },
    };
    const c = config[status] || config.PENDING_APPROVAL;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  // For stats, load all brandings once
  const [allBrandings, setAllBrandings] = useState<BrandingWithOrg[]>([]);
  useEffect(() => {
    const loadAll = async () => {
      try {
        const res = await getAllBrandings({});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAllBrandings((res as any)?.data || res || []);
      } catch {
        // Silently fail for stats
      }
    };
    loadAll();
  }, [refreshKey]);

  const allStats = {
    pending: allBrandings.filter((b) => b.status === 'PENDING_APPROVAL').length,
    active: allBrandings.filter((b) => b.status === 'ACTIVE').length,
    rejected: allBrandings.filter((b) => b.status === 'INACTIVE').length,
    total: allBrandings.length,
  };

  const brandingList = Array.isArray(brandings) ? brandings : [];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-xl font-bold mt-1">{allStats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <p className="text-xl font-bold mt-1">{allStats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Rejected</span>
            </div>
            <p className="text-xl font-bold mt-1">{allStats.rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold mt-1">{allStats.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by brand name, organizer, or email..."
                className="pl-9"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">
                  Pending
                  {allStats.pending > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                      {allStats.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
        </div>
      ) : brandingList.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Palette className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">No brandings found</h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'pending'
                  ? 'No pending branding requests'
                  : 'No brandings match your search'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {brandingList.map((branding) => (
            <Card key={branding.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {branding.logoUrl ? (
                      <img
                        src={branding.logoUrl}
                        alt={branding.brandName || 'Logo'}
                        className="h-12 w-12 rounded-md object-contain border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).className = 'h-12 w-12 rounded-md bg-muted';
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                        <Palette className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm truncate">
                        {branding.brandName || 'Unnamed Brand'}
                      </span>
                      {getStatusBadge(branding.status)}
                    </div>
                    {branding.organizer && (
                      <p className="text-xs text-muted-foreground">
                        {branding.organizer.organizationName ||
                          `${branding.organizer.firstName} ${branding.organizer.lastName}`}{' '}
                        ({branding.organizer.email})
                      </p>
                    )}
                    {branding.tagline && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">
                        {branding.tagline}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {branding.supportEmail && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {branding.supportEmail}
                        </span>
                      )}
                      {branding.websiteUrl && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          {branding.websiteUrl}
                        </span>
                      )}
                    </div>
                    {/* Color swatches */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {[
                        branding.primaryColor,
                        branding.secondaryColor,
                        branding.accentColor,
                      ]
                        .filter(Boolean)
                        .map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBranding(branding);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditBranding(branding)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    {branding.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(branding.id)}
                          disabled={processingId === branding.id}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedBranding(branding);
                            setShowRejectModal(true);
                          }}
                          disabled={processingId === branding.id}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Branding Details</DialogTitle>
          </DialogHeader>
          {selectedBranding && (
            <div className="space-y-4">
              {/* Logo */}
              {selectedBranding.logoUrl && (
                <div className="flex justify-center">
                  <img
                    src={selectedBranding.logoUrl}
                    alt="Logo"
                    className="max-h-20 object-contain"
                  />
                </div>
              )}

              {/* Brand info */}
              <div>
                <p className="font-semibold text-lg">{selectedBranding.brandName || 'Unnamed'}</p>
                {selectedBranding.tagline && (
                  <p className="text-sm text-muted-foreground italic">{selectedBranding.tagline}</p>
                )}
                <div className="mt-1">{getStatusBadge(selectedBranding.status)}</div>
              </div>

              {/* Organizer */}
              {selectedBranding.organizer && (
                <div>
                  <Label className="text-xs text-muted-foreground">Organizer</Label>
                  <p className="text-sm">
                    {selectedBranding.organizer.organizationName ||
                      `${selectedBranding.organizer.firstName} ${selectedBranding.organizer.lastName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedBranding.organizer.email}</p>
                </div>
              )}

              {/* Colors */}
              <div>
                <Label className="text-xs text-muted-foreground">Colors</Label>
                <div className="grid grid-cols-6 gap-2 mt-1">
                  {[
                    { label: 'Primary', color: selectedBranding.primaryColor },
                    { label: 'Secondary', color: selectedBranding.secondaryColor },
                    { label: 'Accent', color: selectedBranding.accentColor },
                    { label: 'Background', color: selectedBranding.backgroundColor },
                    { label: 'Text', color: selectedBranding.textColor },
                    { label: 'Link', color: selectedBranding.linkColor },
                  ].map(({ label, color }) => (
                    <div key={label} className="text-center">
                      <div
                        className="w-full h-8 rounded border"
                        style={{ backgroundColor: color || '#ccc' }}
                      />
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              {(selectedBranding.supportEmail ||
                selectedBranding.supportPhone ||
                selectedBranding.websiteUrl) && (
                <div>
                  <Label className="text-xs text-muted-foreground">Contact</Label>
                  <div className="text-sm space-y-0.5 mt-1">
                    {selectedBranding.supportEmail && <p>Email: {selectedBranding.supportEmail}</p>}
                    {selectedBranding.supportPhone && <p>Phone: {selectedBranding.supportPhone}</p>}
                    {selectedBranding.websiteUrl && <p>Website: {selectedBranding.websiteUrl}</p>}
                  </div>
                </div>
              )}

              {/* Typography */}
              {(selectedBranding.fontFamily || selectedBranding.headingFont) && (
                <div>
                  <Label className="text-xs text-muted-foreground">Typography</Label>
                  <div className="text-sm space-y-0.5 mt-1">
                    {selectedBranding.fontFamily && <p>Body: {selectedBranding.fontFamily}</p>}
                    {selectedBranding.headingFont && <p>Heading: {selectedBranding.headingFont}</p>}
                  </div>
                </div>
              )}

              {/* Email branding */}
              {(selectedBranding.emailFooterText || selectedBranding.emailSignature) && (
                <div>
                  <Label className="text-xs text-muted-foreground">Email Branding</Label>
                  <div className="text-sm space-y-1 mt-1">
                    {selectedBranding.emailFooterText && (
                      <p className="text-xs bg-muted p-2 rounded">{selectedBranding.emailFooterText}</p>
                    )}
                    {selectedBranding.emailSignature && (
                      <div
                        className="text-xs bg-muted p-2 rounded"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedBranding.emailSignature) }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {selectedBranding.rejectionReason && (
                <div className="bg-destructive/5 border border-destructive rounded-md p-3">
                  <Label className="text-xs text-destructive">Rejection Reason</Label>
                  <p className="text-sm text-destructive mt-1">{selectedBranding.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Branding</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this branding request. The organizer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Rejection Reason</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this branding was rejected..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason || processingId === selectedBranding?.id}
            >
              {processingId === selectedBranding?.id ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandingTab;
