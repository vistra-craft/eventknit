import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  getAllBrandings,
  updateBrandingStatus,
  verifyCustomDomain,
  type WhiteLabelBranding,
  type CustomDomain,
} from '@/lib/white-label-api';
import {
  Search,
  Check,
  X,
  Eye,
  Loader2,
  Palette,
  Globe,
  Building,
  Mail,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const WhiteLabelManagementPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [brandings, setBrandings] = useState<WhiteLabelBranding[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranding, setSelectedBranding] = useState<WhiteLabelBranding | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadBrandings = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = activeTab === 'pending' ? 'PENDING_APPROVAL' : activeTab === 'active' ? 'ACTIVE' : undefined;
      const res = await getAllBrandings({ status, search: searchTerm || undefined });
      setBrandings(res.data || []);
    } catch (error) {
      console.error('Failed to load brandings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load branding requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm, toast]);

  useEffect(() => {
    loadBrandings();
  }, [loadBrandings]);

  const handleApprove = async (brandingId: string) => {
    try {
      setProcessingId(brandingId);
      await updateBrandingStatus(brandingId, 'ACTIVE');
      toast({
        title: 'Approved',
        description: 'Branding has been approved and is now active',
      });
      loadBrandings();
    } catch (error) {
      console.error('Failed to approve branding:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve branding',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBranding) return;

    try {
      setProcessingId(selectedBranding.id);
      await updateBrandingStatus(selectedBranding.id, 'INACTIVE', rejectionReason);
      toast({
        title: 'Rejected',
        description: 'Branding request has been rejected',
      });
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedBranding(null);
      loadBrandings();
    } catch (error) {
      console.error('Failed to reject branding:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject branding',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (branding: WhiteLabelBranding) => {
    setSelectedBranding(branding);
    setShowRejectModal(true);
  };

  const openDetailsModal = (branding: WhiteLabelBranding) => {
    setSelectedBranding(branding);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBrandings = brandings.filter(b => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      b.brandName?.toLowerCase().includes(search) ||
      b.supportEmail?.toLowerCase().includes(search)
    );
  });

  const pendingCount = brandings.filter(b => b.status === 'PENDING_APPROVAL').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">White-Label Management</h1>
            <p className="text-muted-foreground">
              Review and approve organizer branding requests
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              {pendingCount} pending approval
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {brandings.filter(b => b.status === 'PENDING_APPROVAL').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {brandings.filter(b => b.status === 'ACTIVE').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {brandings.filter(b => b.status === 'INACTIVE').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Palette className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{brandings.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by brand name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">
                  Pending Approval
                  {pendingCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredBrandings.length === 0 ? (
                  <div className="text-center py-12">
                    <Palette className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No branding requests found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBrandings.map((branding) => (
                      <Card key={branding.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              {/* Brand Logo Preview */}
                              <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                                {branding.logoUrl ? (
                                  <img
                                    src={branding.logoUrl}
                                    alt={branding.brandName || 'Brand logo'}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <Palette className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>

                              {/* Brand Info */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">
                                    {branding.brandName || 'Unnamed Brand'}
                                  </h3>
                                  {getStatusBadge(branding.status)}
                                </div>
                                {branding.tagline && (
                                  <p className="text-sm text-muted-foreground">
                                    {branding.tagline}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {branding.supportEmail && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {branding.supportEmail}
                                    </span>
                                  )}
                                  {branding.websiteUrl && (
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      {branding.websiteUrl}
                                    </span>
                                  )}
                                </div>
                                {/* Color Preview */}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-muted-foreground">Colors:</span>
                                  {branding.primaryColor && (
                                    <div
                                      className="w-5 h-5 rounded border"
                                      style={{ backgroundColor: branding.primaryColor }}
                                      title={`Primary: ${branding.primaryColor}`}
                                    />
                                  )}
                                  {branding.secondaryColor && (
                                    <div
                                      className="w-5 h-5 rounded border"
                                      style={{ backgroundColor: branding.secondaryColor }}
                                      title={`Secondary: ${branding.secondaryColor}`}
                                    />
                                  )}
                                  {branding.accentColor && (
                                    <div
                                      className="w-5 h-5 rounded border"
                                      style={{ backgroundColor: branding.accentColor }}
                                      title={`Accent: ${branding.accentColor}`}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDetailsModal(branding)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {branding.status === 'PENDING_APPROVAL' && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleApprove(branding.id)}
                                    disabled={processingId === branding.id}
                                  >
                                    {processingId === branding.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openRejectModal(branding)}
                                    disabled={processingId === branding.id}
                                  >
                                    <X className="h-4 w-4 mr-1" />
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Branding Details</DialogTitle>
              <DialogDescription>
                Review the branding configuration submitted by the organizer
              </DialogDescription>
            </DialogHeader>
            {selectedBranding && (
              <div className="space-y-6">
                {/* Logo Preview */}
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                    {selectedBranding.logoUrl ? (
                      <img
                        src={selectedBranding.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Palette className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedBranding.brandName || 'Unnamed Brand'}
                    </h3>
                    {selectedBranding.tagline && (
                      <p className="text-muted-foreground">{selectedBranding.tagline}</p>
                    )}
                    {getStatusBadge(selectedBranding.status)}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Brand Colors</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Primary', color: selectedBranding.primaryColor },
                      { label: 'Secondary', color: selectedBranding.secondaryColor },
                      { label: 'Accent', color: selectedBranding.accentColor },
                      { label: 'Background', color: selectedBranding.backgroundColor },
                      { label: 'Text', color: selectedBranding.textColor },
                      { label: 'Link', color: selectedBranding.linkColor },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: item.color || '#ccc' }}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-mono">{item.color || 'Not set'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p>{selectedBranding.supportEmail || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p>{selectedBranding.supportPhone || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Website:</span>
                      <p>
                        {selectedBranding.websiteUrl ? (
                          <a
                            href={selectedBranding.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {selectedBranding.websiteUrl}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          'Not set'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Typography */}
                {(selectedBranding.fontFamily || selectedBranding.headingFont) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Typography</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Body Font:</span>
                        <p>{selectedBranding.fontFamily || 'Default'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Heading Font:</span>
                        <p>{selectedBranding.headingFont || 'Default'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Branding */}
                {(selectedBranding.emailFooterText || selectedBranding.emailSignature) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Email Branding</h4>
                    <div className="space-y-2 text-sm">
                      {selectedBranding.emailFooterText && (
                        <div>
                          <span className="text-muted-foreground">Footer Text:</span>
                          <p className="bg-muted p-2 rounded mt-1">
                            {selectedBranding.emailFooterText}
                          </p>
                        </div>
                      )}
                      {selectedBranding.emailSignature && (
                        <div>
                          <span className="text-muted-foreground">Signature:</span>
                          <p className="bg-muted p-2 rounded mt-1">
                            {selectedBranding.emailSignature}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection Reason (if rejected) */}
                {selectedBranding.status === 'INACTIVE' && selectedBranding.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800 mb-1">Rejection Reason</h4>
                    <p className="text-sm text-red-700">{selectedBranding.rejectionReason}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              {selectedBranding?.status === 'PENDING_APPROVAL' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDetailsModal(false);
                      openRejectModal(selectedBranding);
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      handleApprove(selectedBranding.id);
                      setShowDetailsModal(false);
                    }}
                  >
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Branding Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this branding request. The organizer will be
                notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter the reason for rejection..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId !== null}
              >
                {processingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default WhiteLabelManagementPage;
