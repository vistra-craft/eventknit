import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import {
  getCustomDomains,
  addCustomDomain,
  updateCustomDomain,
  deleteCustomDomain,
  type CustomDomain,
  type CreateCustomDomainData,
} from '@/lib/white-label-api';
import { Plus, Trash2, Globe, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AdminCustomDomainsPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCustomDomainData>({
    domain: '',
    subdomain: '',
    isPrimary: false,
    cnameTarget: '',
    ipAddress: '',
  });

  const loadDomains = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCustomDomains();
      setDomains(res.data || []);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast({
        title: 'Error',
        description: message || 'Failed to load custom domains',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const handleAddDomain = async () => {
    try {
      setIsSaving(true);
      await addCustomDomain(formData);
      toast({
        title: 'Success',
        description: 'Custom domain added successfully. Please complete DNS verification.',
      });
      setIsDialogOpen(false);
      setFormData({
        domain: '',
        subdomain: '',
        isPrimary: false,
        cnameTarget: '',
        ipAddress: '',
      });
      loadDomains();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast({
        title: 'Error',
        description: message || 'Failed to add custom domain',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) {
      return;
    }

    try {
      await deleteCustomDomain(domainId);
      toast({
        title: 'Success',
        description: 'Custom domain deleted successfully',
      });
      loadDomains();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast({
        title: 'Error',
        description: message || 'Failed to delete custom domain',
        variant: 'destructive',
      });
    }
  };

  const handleSetPrimary = async (domainId: string) => {
    try {
      await updateCustomDomain(domainId, { isPrimary: true });
      toast({
        title: 'Success',
        description: 'Primary domain updated',
      });
      loadDomains();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast({
        title: 'Error',
        description: message || 'Failed to update domain',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: CustomDomain['status']) => {
    const variants: Record<
      CustomDomain['status'] | string,
      { variant: 'default' | 'secondary' | 'destructive'; icon: typeof CheckCircle; label: string }
    > = {
      VERIFIED: { variant: 'default', icon: CheckCircle, label: 'Verified' },
      PENDING: { variant: 'secondary', icon: Clock, label: 'Pending' },
      FAILED: { variant: 'destructive', icon: XCircle, label: 'Failed' },
      SUSPENDED: { variant: 'destructive', icon: AlertCircle, label: 'Suspended' },
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading custom domains...</div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Custom Domains</h1>
            <p className="text-muted-foreground mt-1">
              Manage custom domains for white-label branding
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Domain</DialogTitle>
                <DialogDescription>
                  Add a custom domain for events. You'll need to verify ownership via DNS.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain *</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="events.example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain (Optional)</Label>
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    placeholder="events"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnameTarget">CNAME Target (Optional)</Label>
                  <Input
                    id="cnameTarget"
                    value={formData.cnameTarget}
                    onChange={(e) => setFormData({ ...formData, cnameTarget: e.target.value })}
                    placeholder="cname.eventknit.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ipAddress">IP Address (Optional)</Label>
                  <Input
                    id="ipAddress"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    placeholder="192.168.1.1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDomain} disabled={isSaving || !formData.domain}>
                  {isSaving ? 'Adding...' : 'Add Domain'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {domains.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Custom Domains</h3>
                <p className="text-muted-foreground mb-4">
                  Add a custom domain to enable white-label branding for events.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Domain
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {domains.map((domain) => (
              <Card key={domain.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        {domain.domain}
                        {domain.isPrimary && (
                          <Badge variant="default" className="ml-2">
                            Primary
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Added {new Date(domain.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(domain.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {domain.status === 'PENDING' && domain.verificationCode && (
                      <div className="bg-warning/5 border border-warning rounded-lg p-4">
                        <p className="font-medium text-warning mb-2">
                          DNS Verification Required
                        </p>
                        <p className="text-sm text-warning mb-2">
                          Add the following TXT record to your DNS:
                        </p>
                        <div className="bg-white rounded p-2 font-mono text-sm">
                          <div className="mb-1">
                            <strong>Type:</strong> TXT
                          </div>
                          <div className="mb-1">
                            <strong>Name:</strong> {domain.domain}
                          </div>
                          <div>
                            <strong>Value:</strong> {domain.verificationCode}
                          </div>
                        </div>
                      </div>
                    )}

                    {domain.status === 'VERIFIED' && (
                      <div className="bg-success/5 border border-success rounded-lg p-4">
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Domain verified and active</span>
                        </div>
                        {domain.verifiedAt && (
                          <p className="text-sm text-success mt-1">
                            Verified on {new Date(domain.verifiedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {domain.status === 'FAILED' && domain.failureReason && (
                      <div className="bg-destructive/5 border border-destructive rounded-lg p-4">
                        <p className="font-medium text-destructive mb-1">Verification Failed</p>
                        <p className="text-sm text-destructive">{domain.failureReason}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {domain.subdomain && (
                        <div>
                          <span className="font-medium">Subdomain:</span> {domain.subdomain}
                        </div>
                      )}
                      {domain.cnameTarget && (
                        <div>
                          <span className="font-medium">CNAME Target:</span> {domain.cnameTarget}
                        </div>
                      )}
                      {domain.ipAddress && (
                        <div>
                          <span className="font-medium">IP Address:</span> {domain.ipAddress}
                        </div>
                      )}
                      {domain.sslEnabled && (
                        <div>
                          <span className="font-medium">SSL:</span> Enabled
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      {!domain.isPrimary && domain.status === 'VERIFIED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(domain.id)}
                        >
                          Set as Primary
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  );
};

export default AdminCustomDomainsPage;
