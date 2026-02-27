import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Ticket,
  User,
  Shield,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getUserById,
  suspendUser,
  activateUser,
  deactivateUser,
  type Attendee,
  type EventRegistration,
} from "@/lib/admin-api";
import { useToast } from "@/hooks/useToast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getStatusBadgeClass(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    SUSPENDED: "bg-red-500/10 text-red-600 border-red-500/20",
    DEACTIVATED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    PENDING_APPROVAL: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };
  return map[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
}

function getRegistrationStatusClass(status: string) {
  const map: Record<string, string> = {
    CONFIRMED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
    COMPLETED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };
  return map[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-3 gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm text-foreground text-right">{value}</div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AttendeeDetailsPage = () => {
  const { attendeeId } = useParams();
  const location = useLocation();
  const { toast } = useToast();

  // Prefer data passed through navigation state (already loaded in list)
  const stateAttendee = (location.state as { attendee?: Attendee } | null)?.attendee ?? null;

  const [userData, setUserData] = useState(stateAttendee);
  const [registrations] = useState<EventRegistration[]>(
    stateAttendee?.registrations ?? []
  );
  const [loading, setLoading] = useState(!stateAttendee);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (stateAttendee || !attendeeId) return;

    const fetch = async () => {
      try {
        setLoading(true);
        const response = await getUserById(attendeeId);
        if (response.success && response.data?.user) {
          setUserData(response.data.user as Attendee);
          // registrations not available from getUserById — stays empty
        } else {
          setError("Attendee not found");
        }
      } catch {
        setError("Failed to load attendee details");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [attendeeId, stateAttendee]);

  const handleSuspend = async () => {
    if (!attendeeId) return;
    try {
      setActionLoading(true);
      const response = await suspendUser(attendeeId);
      if (response.success) {
        setUserData((prev) => prev ? { ...prev, status: "SUSPENDED" as const } : null);
        toast({ title: "Attendee suspended" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to suspend", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!attendeeId) return;
    try {
      setActionLoading(true);
      const response = await activateUser(attendeeId);
      if (response.success) {
        setUserData((prev) => prev ? { ...prev, status: "ACTIVE" as const } : null);
        toast({ title: "Attendee activated" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to activate", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!attendeeId) return;
    try {
      setActionLoading(true);
      const response = await deactivateUser(attendeeId);
      if (response.success) {
        setUserData((prev) => prev ? { ...prev, status: "DEACTIVATED" as const } : null);
        toast({ title: "Attendee deactivated" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to deactivate", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader />
        <span className="ml-2 text-muted-foreground">Loading attendee details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <BackButton to="/admin/users/attendees" label="Back to Attendees" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userData) return null;

  const status = userData.status;
  const totalSpent = registrations.reduce((sum, r) => sum + r.totalAmount, 0);
  const avgSpend = registrations.length > 0 ? totalSpent / registrations.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/admin/users/attendees" label="Back to Attendees" />
          <div className="flex items-center gap-3">
            <Avatar
              src={undefined}
              name={`${userData.firstName} ${userData.lastName}`}
              alt={`${userData.firstName} ${userData.lastName}`}
              size="lg"
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {userData.firstName} {userData.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={`text-xs ${getStatusBadgeClass(status)}`}>
            {status === "PENDING_APPROVAL" ? "Pending" : status}
          </Badge>
          {status === "ACTIVE" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSuspend}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader className="inline mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Suspend
            </Button>
          )}
          {(status === "SUSPENDED" || status === "DEACTIVATED") && (
            <Button size="sm" onClick={handleActivate} disabled={actionLoading}>
              {actionLoading ? <Loader className="inline mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Reactivate
            </Button>
          )}
          {status === "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeactivate}
              disabled={actionLoading}
            >
              Deactivate
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="Events Attended"
          value={registrations.length}
        />
        <StatCard
          icon={DollarSign}
          label="Total Spent"
          value={formatCurrency(totalSpent)}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg per Event"
          value={registrations.length > 0 ? formatCurrency(avgSpend) : "—"}
        />
        <StatCard
          icon={Calendar}
          label="Member Since"
          value={formatDate(userData.createdAt)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">
            Registrations {registrations.length > 0 && `(${registrations.length})`}
          </TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-border/40">
                  <InfoRow
                    icon={User}
                    label="Full Name"
                    value={`${userData.firstName} ${userData.lastName}`}
                  />
                  <InfoRow icon={Mail} label="Email" value={userData.email} />
                  {userData.phoneNumber && (
                    <InfoRow icon={Phone} label="Phone" value={userData.phoneNumber} />
                  )}
                  <InfoRow
                    icon={Calendar}
                    label="Member Since"
                    value={formatDate(userData.createdAt)}
                  />
                </CardContent>
              </Card>

              {/* Account */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-border/40">
                  <InfoRow
                    icon={Shield}
                    label="Status"
                    value={
                      <Badge className={`text-xs ${getStatusBadgeClass(status)}`}>
                        {status === "PENDING_APPROVAL" ? "Pending" : status}
                      </Badge>
                    }
                  />
                  <InfoRow
                    icon={CheckCircle}
                    label="Email Verified"
                    value={
                      userData.isEmailVerified ? (
                        <span className="text-emerald-600">Verified</span>
                      ) : (
                        <span className="text-amber-600">Not verified</span>
                      )
                    }
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar: activity summary */}
            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Activity Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Total Events", value: registrations.length },
                    { label: "Total Spent", value: formatCurrency(totalSpent) },
                    {
                      label: "Avg per Event",
                      value: registrations.length > 0 ? formatCurrency(avgSpend) : "—",
                    },
                    {
                      label: "Last Registration",
                      value:
                        registrations.length > 0
                          ? formatDate(
                              registrations.sort(
                                (a, b) =>
                                  new Date(b.createdAt).getTime() -
                                  new Date(a.createdAt).getTime()
                              )[0].createdAt
                            )
                          : "—",
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Registrations */}
        <TabsContent value="registrations" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Registration History</CardTitle>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ticket className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm">No registrations found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 pl-0">
                          Event
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 hidden sm:table-cell">
                          Event Date
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 hidden md:table-cell">
                          Registered
                        </th>
                        <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 hidden sm:table-cell">
                          Status
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 pr-0">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {registrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-3 pl-0">
                            <p className="text-sm font-medium text-foreground">
                              {reg.event.title}
                            </p>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <p className="text-sm text-muted-foreground">
                              {formatDate(reg.event.startDate)}
                            </p>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <p className="text-sm text-muted-foreground">
                              {formatDate(reg.createdAt)}
                            </p>
                          </td>
                          <td className="p-3 text-center hidden sm:table-cell">
                            <Badge
                              className={`text-xs ${getRegistrationStatusClass(reg.status)}`}
                            >
                              {reg.status}
                            </Badge>
                          </td>
                          <td className="p-3 pr-0 text-right">
                            <p className="text-sm font-medium text-foreground">
                              {formatCurrency(reg.totalAmount)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border">
                        <td
                          colSpan={4}
                          className="p-3 pl-0 text-sm font-medium text-muted-foreground"
                        >
                          Total
                        </td>
                        <td className="p-3 pr-0 text-right text-sm font-bold text-foreground">
                          {formatCurrency(totalSpent)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support */}
        <TabsContent value="support" className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm">No support tickets found.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendeeDetailsPage;
