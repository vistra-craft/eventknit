import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types/auth';
import { useOrganizers } from '@/hooks/queries/useOrganizers';
import {
  useApproveOrganizer,
  useSuspendOrganizer,
  useDeactivateOrganizer,
  useActivateOrganizer,
} from '@/hooks/mutations/useOrganizerActions';
import { useUsersStats } from '@/hooks/queries/useUsersStats';
import OrganizerDetailSheet from '@/components/admin/OrganizerDetailSheet';
import { exportUserData } from '@/lib/utils/export';
import { useToast } from '@/hooks/useToast';
import type { OrganizerUser, UserStatus } from '@/lib/admin-api';

// ─── Status badge helper ──────────────────────────────────────────────
function getStatusBadgeClass(status: UserStatus) {
  const map: Record<UserStatus, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    SUSPENDED: 'bg-red-500/10 text-red-600 border-red-500/20',
    DEACTIVATED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    PENDING_APPROVAL: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };
  return map[status] || '';
}

function VerificationBadgeInline({ level }: { level: number }) {
  if (level >= 3) {
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
        Full
      </Badge>
    );
  }
  if (level >= 2) {
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20">
        <Shield className="h-2.5 w-2.5 mr-0.5" />
        ID
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] px-1.5 py-0 bg-gray-500/10 text-gray-500 border-gray-500/20">
      <ShieldAlert className="h-2.5 w-2.5 mr-0.5" />
      Basic
    </Badge>
  );
}

function TierBadgeInline({ tier }: { tier: string | null | undefined }) {
  if (!tier) return <span className="text-xs text-muted-foreground">—</span>;
  const map: Record<string, string> = {
    BASIC: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    STANDARD: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    PREMIUM: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };
  return (
    <Badge className={`text-[10px] px-1.5 py-0 ${map[tier] || ''}`}>
      {tier}
    </Badge>
  );
}

function KYCBadgeInline({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const map: Record<string, string> = {
    APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  return (
    <Badge className={`text-[10px] px-1.5 py-0 ${map[status] || ''}`}>
      {status}
    </Badge>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Stats Card ──────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  gradient: string;
}

function StatCard({ title, value, icon: Icon, gradient }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-12" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
const OrganizersContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Sheet
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Suspend dialog
  const [suspendTarget, setSuspendTarget] = useState<OrganizerUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Permissions
  const { canModifyUser, canCreateRole } = usePermissions();
  const canModifyOrganizer = canModifyUser(UserRole.ORGANIZER);
  const canCreateOrganizer = canCreateRole(UserRole.ORGANIZER);

  // Debounced search — reset to page 1 on filter change
  const filters = useMemo(
    () => ({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined,
      page,
      limit,
    }),
    [statusFilter, searchTerm, page, limit]
  );

  // Data fetching
  const { data, isLoading, isError } = useOrganizers(filters);
  const { data: statsData } = useUsersStats('30d');

  // Mutations
  const approveMutation = useApproveOrganizer();
  const suspendMutation = useSuspendOrganizer();
  const deactivateMutation = useDeactivateOrganizer();
  const activateMutation = useActivateOrganizer();

  const organizers = data?.users ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  // Stats from the stats endpoint
  const stats = useMemo(() => {
    const s = statsData?.stats;
    return [
      {
        title: 'Total Organizers',
        value: s?.totalOrganizers?.value ?? total.toString(),
        icon: Users,
        gradient: 'from-violet-500 to-purple-600',
      },
      {
        title: 'Active',
        value: s?.activeUsers?.value ?? '—',
        icon: UserCheck,
        gradient: 'from-emerald-500 to-green-600',
      },
      {
        title: 'Total Attendees',
        value: s?.totalAttendees?.value ?? '—',
        icon: Users,
        gradient: 'from-blue-500 to-cyan-600',
      },
      {
        title: 'Total Staff',
        value: s?.totalStaff?.value ?? '—',
        icon: UserCheck,
        gradient: 'from-orange-500 to-amber-600',
      },
    ];
  }, [statsData, total]);

  const handleRowClick = useCallback((org: OrganizerUser) => {
    setSelectedOrganizer(org);
    setSheetOpen(true);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setStatusFilter(value as UserStatus | 'all');
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  }, []);

  const handleLimitChange = useCallback((value: string) => {
    setLimit(parseInt(value, 10));
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Organizers</h2>
          <p className="text-sm text-muted-foreground">Manage external event organizers</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {canCreateOrganizer ? (
            <Button size="sm" onClick={() => navigate('/admin/users/organizers/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Organizer
            </Button>
          ) : (
            <Button size="sm" disabled title="You do not have permission to create organizer accounts">
              <Plus className="h-4 w-4 mr-2" />
              Add Organizer
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <section className="sticky top-0 z-10 bg-background pb-2 pt-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </section>

      {/* Filters */}
      <Card className="border-border/40 bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, email, or organization..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Per page</span>
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/40 bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-destructive">
              Failed to load organizers. Please try again.
            </div>
          ) : organizers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No organizers found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 pl-4">
                      Organizer
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 hidden lg:table-cell">
                      Email
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 hidden md:table-cell">
                      Verification
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 hidden md:table-cell">
                      KYC
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 hidden lg:table-cell">
                      Tier
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 hidden sm:table-cell">
                      Events
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider p-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 hidden xl:table-cell">
                      Joined
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 pr-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {organizers.map((org) => (
                    <tr
                      key={org.id}
                      onClick={() => handleRowClick(org)}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      {/* Organizer (avatar + name + org) */}
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={org.avatar}
                            name={`${org.firstName} ${org.lastName}`}
                            size="md"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {org.firstName} {org.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {org.organizationName || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-3 hidden lg:table-cell">
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {org.email}
                        </p>
                      </td>

                      {/* Verification */}
                      <td className="p-3 text-center hidden md:table-cell">
                        <VerificationBadgeInline level={org.verificationLevel ?? 0} />
                      </td>

                      {/* KYC */}
                      <td className="p-3 text-center hidden md:table-cell">
                        <KYCBadgeInline status={org.kycStatus} />
                      </td>

                      {/* Tier */}
                      <td className="p-3 text-center hidden lg:table-cell">
                        <TierBadgeInline tier={org.organizerSubscription?.tier} />
                      </td>

                      {/* Events */}
                      <td className="p-3 text-center hidden sm:table-cell">
                        <span className="text-sm text-foreground font-medium">
                          {org._count?.eventsCreated ?? 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <Badge className={`text-xs ${getStatusBadgeClass(org.status)}`}>
                          {org.status === 'PENDING_APPROVAL' ? 'Pending' : org.status}
                        </Badge>
                      </td>

                      {/* Joined */}
                      <td className="p-3 hidden xl:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(org.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 pr-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Quick action buttons */}
                          {org.status === 'PENDING_APPROVAL' && canModifyOrganizer && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                              onClick={() => approveMutation.mutate(org.id)}
                              disabled={approveMutation.isPending}
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {org.status === 'ACTIVE' && canModifyOrganizer && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => { setSuspendTarget(org); setSuspendReason(''); }}
                              disabled={suspendMutation.isPending}
                              title="Suspend"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(org.status === 'SUSPENDED' || org.status === 'DEACTIVATED') && canModifyOrganizer && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                              onClick={() => activateMutation.mutate(org.id)}
                              disabled={activateMutation.isPending}
                              title="Activate"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {/* More actions dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedOrganizer(org);
                                setSheetOpen(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {org.status === 'PENDING_APPROVAL' && canModifyOrganizer && (
                                <DropdownMenuItem onClick={() => approveMutation.mutate(org.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {org.status === 'ACTIVE' && canModifyOrganizer && (
                                <>
                                  <DropdownMenuItem onClick={() => { setSuspendTarget(org); setSuspendReason(''); }}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Suspend
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => deactivateMutation.mutate({ userId: org.id })}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(org.status === 'SUSPENDED' || org.status === 'DEACTIVATED') && canModifyOrganizer && (
                                <DropdownMenuItem onClick={() => activateMutation.mutate(org.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                try {
                                  exportUserData({
                                    id: org.id,
                                    firstName: org.firstName,
                                    lastName: org.lastName,
                                    email: org.email,
                                    role: org.role,
                                    status: org.status,
                                    createdAt: org.createdAt,
                                    organizationName: org.organizationName || undefined,
                                  });
                                  toast({ title: 'Exported', description: 'Organizer data exported successfully' });
                                } catch {
                                  toast({ title: 'Export failed', description: 'Failed to export organizer data', variant: 'destructive' });
                                }
                              }}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Data
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {organizers.length} of {total} organizers
          </p>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Detail Sheet */}
      <OrganizerDetailSheet
        organizer={selectedOrganizer}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canModify={canModifyOrganizer}
      />

      {/* Suspension dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(open) => { if (!open) setSuspendTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Suspend Organizer
            </DialogTitle>
            <DialogDescription>
              {suspendTarget && (
                <>
                  You are about to suspend <strong>{suspendTarget.firstName} {suspendTarget.lastName}</strong>
                  {suspendTarget.organizationName ? ` (${suspendTarget.organizationName})` : ''}. They will lose access to organizer features immediately. Provide a reason so they know what to address.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Reason for suspension <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Describe the reason (e.g. policy violation, fraudulent activity, pending review...)"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be emailed to the organizer.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setSuspendTarget(null)}
                disabled={suspendMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={suspendReason.trim().length < 10 || suspendMutation.isPending}
                onClick={() => {
                  if (!suspendTarget) return;
                  suspendMutation.mutate(
                    { userId: suspendTarget.id, reason: suspendReason.trim() },
                    { onSuccess: () => setSuspendTarget(null) }
                  );
                }}
              >
                {suspendMutation.isPending ? 'Suspending...' : 'Suspend Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizersContent;
