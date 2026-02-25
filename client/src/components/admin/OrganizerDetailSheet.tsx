import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Mail,
  Phone,
  Globe,
  Building2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CalendarDays,
  Users,
  TrendingUp,
  FileCheck,
  ExternalLink,
  CheckCircle,
  XCircle,
  Play,
} from 'lucide-react';
import { useOrganizerDetails } from '@/hooks/queries/useOrganizers';
import {
  useApproveOrganizer,
  useSuspendOrganizer,
  useDeactivateOrganizer,
  useActivateOrganizer,
} from '@/hooks/mutations/useOrganizerActions';
import type { OrganizerUser, UserStatus } from '@/lib/admin-api';

interface OrganizerDetailSheetProps {
  organizer: OrganizerUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canModify: boolean;
}

function StatusBadge({ status }: { status: UserStatus }) {
  const config: Record<UserStatus, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    SUSPENDED: { label: 'Suspended', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
    DEACTIVATED: { label: 'Deactivated', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
    PENDING_APPROVAL: { label: 'Pending', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  };
  const { label, className } = config[status] || config.ACTIVE;
  return <Badge className={`text-xs ${className}`}>{label}</Badge>;
}

function VerificationBadge({ level }: { level: number }) {
  if (level >= 3) {
    return (
      <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        <ShieldCheck className="h-3 w-3 mr-1" />
        Full KYC
      </Badge>
    );
  }
  if (level >= 2) {
    return (
      <Badge className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
        <Shield className="h-3 w-3 mr-1" />
        Identity Verified
      </Badge>
    );
  }
  return (
    <Badge className="text-xs bg-gray-500/10 text-gray-500 border-gray-500/20">
      <ShieldAlert className="h-3 w-3 mr-1" />
      Basic
    </Badge>
  );
}

function KYCStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-xs text-muted-foreground">Not submitted</span>;
  const config: Record<string, { label: string; className: string }> = {
    APPROVED: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    PENDING: { label: 'Pending Review', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    REJECTED: { label: 'Rejected', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  };
  const { label, className } = config[status] || { label: status, className: '' };
  return <Badge className={`text-xs ${className}`}>{label}</Badge>;
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.FC<{ className?: string }> }) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
        {label}
      </div>
      <div className="text-sm text-foreground text-right max-w-[55%] truncate">{value}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-8 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return 'KES 0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `KES ${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatEntityType(type: string | null | undefined): string {
  if (!type) return 'N/A';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrganizerDetailSheet({
  organizer,
  open,
  onOpenChange,
  canModify,
}: OrganizerDetailSheetProps) {
  const { data, isLoading } = useOrganizerDetails(open ? organizer?.id ?? null : null);

  const approveMutation = useApproveOrganizer();
  const suspendMutation = useSuspendOrganizer();
  const deactivateMutation = useDeactivateOrganizer();
  const activateMutation = useActivateOrganizer();

  const isActionPending =
    approveMutation.isPending ||
    suspendMutation.isPending ||
    deactivateMutation.isPending ||
    activateMutation.isPending;

  const user = data?.user;
  const status = organizer?.status;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Organizer Details</SheetTitle>
          <SheetDescription>Detailed view of organizer information</SheetDescription>
        </SheetHeader>

        {isLoading || !organizer ? (
          <LoadingSkeleton />
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-border/40">
              <div className="flex items-start gap-4">
                <Avatar
                  src={organizer.avatar}
                  name={`${organizer.firstName} ${organizer.lastName}`}
                  size="xl"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {organizer.firstName} {organizer.lastName}
                  </h3>
                  {organizer.organizationName && (
                    <p className="text-sm text-muted-foreground truncate">
                      {organizer.organizationName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <StatusBadge status={organizer.status} />
                    <VerificationBadge level={organizer.verificationLevel ?? 0} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-6 border-b border-border/40">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 bg-card p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span className="text-xs">Events Created</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {user?._count?.eventsCreated ?? organizer._count?.eventsCreated ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-card p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs">Events Attended</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {user?._count?.eventRegistrations ?? organizer._count?.eventRegistrations ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-card p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-xs">Total Revenue</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {formatCurrency(data?.totalRevenue)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-card p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileCheck className="h-3.5 w-3.5" />
                    <span className="text-xs">KYC Docs</span>
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {user?._count?.kycDocuments ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6 border-b border-border/40">
              <h4 className="text-sm font-medium text-foreground mb-3">Profile Information</h4>
              <div className="divide-y divide-border/30">
                <DetailRow icon={Mail} label="Email" value={organizer.email} />
                {organizer.businessEmail && (
                  <DetailRow icon={Mail} label="Business Email" value={organizer.businessEmail} />
                )}
                {organizer.phoneNumber && (
                  <DetailRow icon={Phone} label="Phone" value={organizer.phoneNumber} />
                )}
                <DetailRow icon={Building2} label="Entity Type" value={formatEntityType(organizer.organizerEntityType)} />
                {organizer.organizerIndustry && (
                  <DetailRow icon={Building2} label="Industry" value={formatEntityType(organizer.organizerIndustry)} />
                )}
                {data?.organizerProfile?.website && (
                  <DetailRow icon={Globe} label="Website" value={
                    <a
                      href={data.organizerProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  } />
                )}
                {data?.organizerProfile?.location && (
                  <DetailRow icon={Building2} label="Location" value={data.organizerProfile.location} />
                )}
                <DetailRow icon={Calendar} label="Joined" value={formatDate(organizer.createdAt)} />
                <DetailRow icon={Calendar} label="Last Login" value={formatDate(organizer.lastLoginAt)} />
              </div>
            </div>

            {/* KYC / Verification */}
            <div className="p-6 border-b border-border/40">
              <h4 className="text-sm font-medium text-foreground mb-3">KYC & Verification</h4>
              <div className="divide-y divide-border/30">
                <DetailRow icon={Shield} label="Verification Level" value={
                  <VerificationBadge level={organizer.verificationLevel ?? 0} />
                } />
                <DetailRow icon={ShieldCheck} label="KYC Status" value={
                  <KYCStatusBadge status={organizer.kycStatus} />
                } />
                <DetailRow icon={ShieldCheck} label="Identity Verified" value={
                  organizer.isIdentityVerified
                    ? <span className="text-emerald-600">Yes</span>
                    : <span className="text-muted-foreground">No</span>
                } />
                <DetailRow icon={FileCheck} label="Profile Complete" value={
                  organizer.profileCompleted
                    ? <span className="text-emerald-600">Yes</span>
                    : <span className="text-amber-600">Incomplete</span>
                } />
                {user?.kycSubmittedAt && (
                  <DetailRow icon={Calendar} label="KYC Submitted" value={formatDate(user.kycSubmittedAt)} />
                )}
                {user?.kycApprovedAt && (
                  <DetailRow icon={Calendar} label="KYC Approved" value={formatDate(user.kycApprovedAt)} />
                )}
                {data?.kycDocumentSummary && data.kycDocumentSummary.length > 0 && (
                  <div className="py-2">
                    <p className="text-xs text-muted-foreground mb-1">Document Summary</p>
                    <div className="flex gap-2 flex-wrap">
                      {data.kycDocumentSummary.map((s) => (
                        <Badge key={s.status} className="text-xs" variant="outline">
                          {s.status}: {s._count.status}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Events */}
            {data?.recentEvents && data.recentEvents.length > 0 && (
              <div className="p-6 border-b border-border/40">
                <h4 className="text-sm font-medium text-foreground mb-3">Recent Events</h4>
                <div className="space-y-2">
                  {data.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.startDate)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">
                          {event._count.registrations} reg.
                        </span>
                        <Badge className="text-xs" variant="outline">{event.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Footer */}
            {canModify && (
              <div className="sticky bottom-0 p-4 bg-background border-t border-border/40 mt-auto">
                <div className="flex gap-2 flex-wrap">
                  {status === 'PENDING_APPROVAL' && (
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(organizer.id)}
                      disabled={isActionPending}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {status === 'ACTIVE' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => suspendMutation.mutate({ userId: organizer.id })}
                        disabled={isActionPending}
                        className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/5"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Suspend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deactivateMutation.mutate({ userId: organizer.id })}
                        disabled={isActionPending}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    </>
                  )}
                  {(status === 'SUSPENDED' || status === 'DEACTIVATED') && (
                    <Button
                      size="sm"
                      onClick={() => activateMutation.mutate(organizer.id)}
                      disabled={isActionPending}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
