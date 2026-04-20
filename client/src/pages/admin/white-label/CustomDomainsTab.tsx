import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  adminGetAllCustomDomains,
  adminAddCustomDomain,
  adminDeleteCustomDomain,
  verifyCustomDomain,
  type CustomDomain,
  type OrganizerInfo,
  type CreateCustomDomainData,
} from '@/lib/white-label-api';
import { getUsers, type User } from '@/lib/admin-api';
import {
  Search,
  Plus,
  Trash2,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type DomainWithOrg = CustomDomain & { organizer?: OrganizerInfo };

interface CustomDomainsTabProps {
  refreshKey: number;
}

const CustomDomainsTab = ({ refreshKey }: CustomDomainsTabProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [domains, setDomains] = useState<DomainWithOrg[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Add domain dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addOrgId, setAddOrgId] = useState('');
  const [addOrgLabel, setAddOrgLabel] = useState('');
  const [addOrgSearch, setAddOrgSearch] = useState('');
  const [orgResults, setOrgResults] = useState<{ id: string; label: string; email: string }[]>([]);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [isSearchingOrg, setIsSearchingOrg] = useState(false);
  const [domainForm, setDomainForm] = useState<CreateCustomDomainData>({
    domain: '',
    subdomain: '',
    isPrimary: false,
    cnameTarget: '',
    ipAddress: '',
  });

  // Verify dialog
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyDomain, setVerifyDomain] = useState<DomainWithOrg | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'VERIFIED' | 'FAILED' | 'SUSPENDED'>('VERIFIED');
  const [failureReason, setFailureReason] = useState('');

  const loadDomains = useCallback(async () => {
    try {
      setIsLoading(true);
      const statusFilter =
        activeTab === 'pending'
          ? 'PENDING'
          : activeTab === 'verified'
            ? 'VERIFIED'
            : undefined;
      const res = await adminGetAllCustomDomains({
        status: statusFilter,
        search: searchTerm || undefined,
      });
      setDomains(res.data ?? []);
    } catch (error) {
      showErrorToast(toast, error, 'Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm, toast]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains, refreshKey]);

  // Organizer search for add dialog
  const searchOrganizers = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setOrgResults([]);
      return;
    }
    setIsSearchingOrg(true);
    try {
      const res = await getUsers({ role: 'ORGANIZER', search: term, limit: 15 });
      const users = res?.data?.users ?? [];
      setOrgResults(
        users.map((u: User) => ({
          id: u.id,
          label: u.organizationName || `${u.firstName} ${u.lastName}`,
          email: u.email,
        })),
      );
    } catch {
      setOrgResults([]);
    } finally {
      setIsSearchingOrg(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (addOrgSearch) searchOrganizers(addOrgSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [addOrgSearch, searchOrganizers]);

  const handleAddDomain = async () => {
    if (!addOrgId) {
      toast({ title: 'Please select an organizer', variant: 'destructive' });
      return;
    }
    if (!domainForm.domain) {
      toast({ title: 'Domain is required', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      await adminAddCustomDomain(addOrgId, domainForm);
      toast({
        title: 'Success',
        description: 'Custom domain added. DNS verification required.',
      });
      setShowAddDialog(false);
      resetAddForm();
      loadDomains();
    } catch (error) {
      showErrorToast(toast, error, 'Failed to add domain');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAddForm = () => {
    setAddOrgId('');
    setAddOrgLabel('');
    setAddOrgSearch('');
    setDomainForm({ domain: '', subdomain: '', isPrimary: false, cnameTarget: '', ipAddress: '' });
  };

  const [deleteDomainConfirm, setDeleteDomainConfirm] = useState<string | null>(null);

  const handleDeleteDomain = async (domainId: string) => {
    try {
      await adminDeleteCustomDomain(domainId);
      toast({ title: 'Success', description: 'Domain deleted' });
      loadDomains();
    } catch (error) {
      showErrorToast(toast, error, 'Failed to delete domain');
    }
  };

  const handleVerify = async () => {
    if (!verifyDomain) return;
    try {
      setIsSaving(true);
      await verifyCustomDomain(
        verifyDomain.id,
        verifyStatus,
        verifyStatus === 'FAILED' ? failureReason : undefined,
      );
      toast({
        title: 'Success',
        description:
          verifyStatus === 'VERIFIED'
            ? 'Domain verified and activated'
            : `Domain marked as ${verifyStatus.toLowerCase()}`,
      });
      setShowVerifyDialog(false);
      setVerifyDomain(null);
      setFailureReason('');
      loadDomains();
    } catch (error) {
      showErrorToast(toast, error, 'Failed to update domain');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: CustomDomain['status']) => {
    const config: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive'; icon: typeof CheckCircle; label: string }
    > = {
      VERIFIED: { variant: 'default', icon: CheckCircle, label: 'Verified' },
      PENDING: { variant: 'secondary', icon: Clock, label: 'Pending' },
      FAILED: { variant: 'destructive', icon: XCircle, label: 'Failed' },
      SUSPENDED: { variant: 'destructive', icon: AlertCircle, label: 'Suspended' },
    };
    const c = config[status] || config.PENDING;
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const domainList = Array.isArray(domains) ? domains : [];

  return (
    <div className="space-y-4">
      {/* Search + Filter + Add */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by domain, organizer name, or email..."
                className="pl-9"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Domain
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size="lg" />
        </div>
      ) : domainList.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Globe className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-base font-medium mb-2">No domains found</h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'pending' ? 'No pending domain verifications' : 'No domains match your search'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {domainList.map((domain) => (
            <Card key={domain.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {domain.domain}
                      {domain.isPrimary && (
                        <Badge variant="default" className="text-[10px]">Primary</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {domain.organizer
                        ? `${domain.organizer.organizationName || `${domain.organizer.firstName} ${domain.organizer.lastName}`} (${domain.organizer.email})`
                        : domain.organizerId}{' '}
                      | Added {new Date(domain.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {getStatusBadge(domain.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* DNS Verification for PENDING */}
                  {domain.status === 'PENDING' && domain.verificationCode && (
                    <div className="bg-secondary border rounded-md p-3">
                      <p className="text-xs font-medium text-foreground mb-1">
                        DNS Verification Required
                      </p>
                      <div className="bg-card rounded p-2 font-mono text-xs space-y-0.5">
                        <div><strong>Type:</strong> TXT</div>
                        <div><strong>Name:</strong> {domain.domain}</div>
                        <div><strong>Value:</strong> {domain.verificationCode}</div>
                      </div>
                    </div>
                  )}

                  {domain.status === 'VERIFIED' && (
                    <div className="flex items-center gap-2 text-success text-xs">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Verified{domain.verifiedAt && ` on ${new Date(domain.verifiedAt).toLocaleDateString()}`}</span>
                    </div>
                  )}

                  {domain.status === 'FAILED' && domain.failureReason && (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-md p-2">
                      <p className="text-xs text-destructive">{domain.failureReason}</p>
                    </div>
                  )}

                  {/* Domain details */}
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    {domain.subdomain && (
                      <div>
                        <span className="text-muted-foreground">Subdomain:</span>{' '}
                        <span className="font-medium">{domain.subdomain}</span>
                      </div>
                    )}
                    {domain.cnameTarget && (
                      <div>
                        <span className="text-muted-foreground">CNAME:</span>{' '}
                        <span className="font-medium">{domain.cnameTarget}</span>
                      </div>
                    )}
                    {domain.ipAddress && (
                      <div>
                        <span className="text-muted-foreground">IP:</span>{' '}
                        <span className="font-medium">{domain.ipAddress}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">SSL:</span>{' '}
                      <span className="font-medium">{domain.sslEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    {(domain.status === 'PENDING' || domain.status === 'FAILED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setVerifyDomain(domain);
                          setVerifyStatus('VERIFIED');
                          setShowVerifyDialog(true);
                        }}
                      >
                        <Shield className="h-3.5 w-3.5 mr-1" />
                        Verify
                      </Button>
                    )}
                    {domain.status === 'VERIFIED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setVerifyDomain(domain);
                          setVerifyStatus('SUSPENDED');
                          setShowVerifyDialog(true);
                        }}
                      >
                        Suspend
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDomainConfirm(domain.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Domain Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Domain</DialogTitle>
            <DialogDescription>
              Add a custom domain for an organizer. DNS verification will be required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Organizer selector */}
            <div className="space-y-1">
              <Label>Organizer *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={addOrgId ? addOrgLabel : addOrgSearch}
                  onChange={(e) => {
                    if (addOrgId) {
                      setAddOrgId('');
                      setAddOrgLabel('');
                    }
                    setAddOrgSearch(e.target.value);
                    setShowOrgDropdown(true);
                  }}
                  onFocus={() => setShowOrgDropdown(true)}
                  placeholder="Search organizers..."
                  className="pl-9"
                />
                {showOrgDropdown && orgResults.length > 0 && !addOrgId && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                    {orgResults.map((org) => (
                      <button
                        key={org.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between"
                        onClick={() => {
                          setAddOrgId(org.id);
                          setAddOrgLabel(org.label);
                          setAddOrgSearch('');
                          setShowOrgDropdown(false);
                        }}
                      >
                        <span className="font-medium">{org.label}</span>
                        <span className="text-xs text-muted-foreground">{org.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isSearchingOrg && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md p-3 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Domain *</Label>
              <Input
                value={domainForm.domain}
                onChange={(e) => setDomainForm({ ...domainForm, domain: e.target.value })}
                placeholder="events.example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Subdomain</Label>
                <Input
                  value={domainForm.subdomain || ''}
                  onChange={(e) => setDomainForm({ ...domainForm, subdomain: e.target.value })}
                  placeholder="events"
                />
              </div>
              <div className="space-y-1">
                <Label>CNAME Target</Label>
                <Input
                  value={domainForm.cnameTarget || ''}
                  onChange={(e) => setDomainForm({ ...domainForm, cnameTarget: e.target.value })}
                  placeholder="cname.eventknit.com"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>IP Address</Label>
              <Input
                value={domainForm.ipAddress || ''}
                onChange={(e) => setDomainForm({ ...domainForm, ipAddress: e.target.value })}
                placeholder="192.168.1.1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDomain} disabled={isSaving || !addOrgId || !domainForm.domain}>
              {isSaving ? 'Adding...' : 'Add Domain'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Domain Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyStatus === 'VERIFIED' ? 'Verify' : verifyStatus === 'SUSPENDED' ? 'Suspend' : 'Update'} Domain
            </DialogTitle>
            <DialogDescription>
              {verifyDomain?.domain}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              {['VERIFIED', 'FAILED', 'SUSPENDED'].map((s) => (
                <Button
                  key={s}
                  variant={verifyStatus === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerifyStatus(s as 'VERIFIED' | 'FAILED' | 'SUSPENDED')}
                >
                  {s === 'VERIFIED' ? 'Verify' : s === 'FAILED' ? 'Fail' : 'Suspend'}
                </Button>
              ))}
            </div>
            {verifyStatus === 'FAILED' && (
              <div className="space-y-1">
                <Label>Failure Reason</Label>
                <Input
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="DNS records not found..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isSaving || (verifyStatus === 'FAILED' && !failureReason)}
            >
              {isSaving ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDomainConfirm} onOpenChange={() => setDeleteDomainConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete domain?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteDomainConfirm) handleDeleteDomain(deleteDomainConfirm); setDeleteDomainConfirm(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomDomainsTab;
