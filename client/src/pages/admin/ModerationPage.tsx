import { useState } from "react";
import { CheckCircle, XCircle, Eye, Ban, User, Flag, MessageSquare, Calendar, Search, Shield } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { suspendUser, deactivateUser, activateUser } from "@/lib/moderation-api";
import { getEventStatusBadgeClass } from "@/lib/utils/event-badge-helpers";

interface ReportedContent {
  id: string;
  type: "event" | "user" | "comment" | "review";
  title: string;
  reportedBy: string;
  reportedUser?: string;
  reason: string;
  description: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  severity: "low" | "medium" | "high";
  reportedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface UserViolation {
  id: string;
  userId: string;
  username: string;
  email: string;
  violationType: "spam" | "harassment" | "inappropriate" | "fraud" | "fake";
  description: string;
  status: "active" | "suspended" | "banned";
  violationCount: number;
  lastViolation: string;
  actions: string[];
}

const mockReportedContent: ReportedContent[] = [
  {
    id: "1",
    type: "event",
    title: "Tech Conference 2024",
    reportedBy: "user_123",
    reason: "Inappropriate content",
    description: "Event description contains offensive language",
    status: "pending",
    severity: "medium",
    reportedAt: "2024-01-28 14:30:00"
  },
  {
    id: "2",
    type: "user",
    title: "User Profile: john_doe",
    reportedBy: "user_456",
    reportedUser: "user_789",
    reason: "Harassment",
    description: "User is sending threatening messages",
    status: "pending",
    severity: "high",
    reportedAt: "2024-01-28 13:15:00"
  },
  {
    id: "3",
    type: "comment",
    title: "Comment on Music Festival",
    reportedBy: "user_321",
    reason: "Spam",
    description: "Repeated promotional messages",
    status: "reviewed",
    severity: "low",
    reportedAt: "2024-01-28 12:00:00",
    reviewedAt: "2024-01-28 12:30:00",
    reviewedBy: "admin_001"
  },
  {
    id: "4",
    type: "review",
    title: "Review for Art Exhibition",
    reportedBy: "user_654",
    reason: "Fake review",
    description: "Review appears to be fake or paid",
    status: "approved",
    severity: "medium",
    reportedAt: "2024-01-28 11:45:00",
    reviewedAt: "2024-01-28 12:15:00",
    reviewedBy: "admin_002"
  },
  {
    id: "5",
    type: "event",
    title: "Business Workshop",
    reportedBy: "user_987",
    reason: "Misleading information",
    description: "Event details don't match actual content",
    status: "rejected",
    severity: "low",
    reportedAt: "2024-01-28 10:30:00",
    reviewedAt: "2024-01-28 11:00:00",
    reviewedBy: "admin_001"
  }
];

const mockUserViolations: UserViolation[] = [
  {
    id: "1",
    userId: "user_789",
    username: "john_doe",
    email: "john@example.com",
    violationType: "harassment",
    description: "Multiple reports of threatening messages",
    status: "suspended",
    violationCount: 3,
    lastViolation: "2024-01-28 13:15:00",
    actions: ["Warning", "Temporary suspension"]
  },
  {
    id: "2",
    userId: "user_456",
    username: "spam_user",
    email: "spam@example.com",
    violationType: "spam",
    description: "Posting promotional content repeatedly",
    status: "banned",
    violationCount: 5,
    lastViolation: "2024-01-27 16:20:00",
    actions: ["Warning", "Content removal", "Permanent ban"]
  },
  {
    id: "3",
    userId: "user_123",
    username: "fake_reviewer",
    email: "fake@example.com",
    violationType: "fake",
    description: "Creating fake reviews for events",
    status: "active",
    violationCount: 1,
    lastViolation: "2024-01-28 11:45:00",
    actions: ["Warning"]
  },
  {
    id: "4",
    userId: "user_321",
    username: "inappropriate_user",
    email: "inappropriate@example.com",
    violationType: "inappropriate",
    description: "Posting inappropriate content",
    status: "suspended",
    violationCount: 2,
    lastViolation: "2024-01-26 14:30:00",
    actions: ["Content removal", "Temporary suspension"]
  }
];

const ModerationPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserViolation | null>(null);
  const [actionReason, setActionReason] = useState("");

  // User violations with local state for UI updates
  const [userViolations, setUserViolations] = useState<UserViolation[]>(mockUserViolations);

  const filteredReports = mockReportedContent.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || report.severity === severityFilter;
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "PENDING",
      reviewed: "APPROVED",
      approved: "APPROVED",
      rejected: "DECLINED",
      active: "ACTIVE",
      suspended: "SUSPENDED",
      banned: "DEACTIVATED",
    };
    const mappedStatus = statusMap[status] || status;
    return getEventStatusBadgeClass(mappedStatus);
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "bg-primary/10 text-primary border-primary/20",
      medium: "bg-warning/10 text-warning border-warning/20",
      high: "bg-destructive/10 text-destructive border-destructive/20"
    };
    return variants[severity as keyof typeof variants] || "bg-muted text-muted-foreground border-border";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      case "comment":
        return <MessageSquare className="h-4 w-4" />;
      case "review":
        return <Flag className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  const handleApprove = (reportId: string) => {
    console.log("Approving report:", reportId);
    // TODO: Implement approval logic when Report model is added
    toast({
      title: "Feature coming soon",
      description: "Report approval will be available in a future update.",
    });
  };

  const handleReject = (reportId: string) => {
    console.log("Rejecting report:", reportId);
    // TODO: Implement rejection logic when Report model is added
    toast({
      title: "Feature coming soon",
      description: "Report rejection will be available in a future update.",
    });
  };

  const openSuspendDialog = (violation: UserViolation) => {
    setSelectedUser(violation);
    setActionReason("");
    setSuspendDialogOpen(true);
  };

  const openBanDialog = (violation: UserViolation) => {
    setSelectedUser(violation);
    setActionReason("");
    setBanDialogOpen(true);
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser.userId);
    try {
      await suspendUser(selectedUser.userId, actionReason || "Violation of platform guidelines");

      // Update local state
      setUserViolations(prev => prev.map(v =>
        v.userId === selectedUser.userId
          ? { ...v, status: "suspended" as const, actions: [...v.actions, "Temporary suspension"] }
          : v
      ));

      toast({
        title: "User suspended",
        description: `${selectedUser.username} has been suspended.`,
      });
      setSuspendDialogOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        variant: "destructive",
        title: "Failed to suspend user",
        description: error.message || "An error occurred while suspending the user.",
      });
    } finally {
      setActionLoading(null);
      setSelectedUser(null);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser.userId);
    try {
      await deactivateUser(selectedUser.userId, actionReason || "Repeated violations - permanent ban");

      // Update local state
      setUserViolations(prev => prev.map(v =>
        v.userId === selectedUser.userId
          ? { ...v, status: "banned" as const, actions: [...v.actions, "Permanent ban"] }
          : v
      ));

      toast({
        title: "User banned",
        description: `${selectedUser.username} has been permanently banned.`,
      });
      setBanDialogOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        variant: "destructive",
        title: "Failed to ban user",
        description: error.message || "An error occurred while banning the user.",
      });
    } finally {
      setActionLoading(null);
      setSelectedUser(null);
    }
  };

  const handleActivateUser = async (violation: UserViolation) => {
    setActionLoading(violation.userId);
    try {
      await activateUser(violation.userId);

      // Update local state
      setUserViolations(prev => prev.map(v =>
        v.userId === violation.userId
          ? { ...v, status: "active" as const, actions: [...v.actions, "Reactivated"] }
          : v
      ));

      toast({
        title: "User reactivated",
        description: `${violation.username} has been reactivated.`,
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        variant: "destructive",
        title: "Failed to reactivate user",
        description: error.message || "An error occurred while reactivating the user.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Content Moderation</h1>
            <p className="text-muted-foreground">Review and manage reported content and user violations</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredReports.filter(r => r.status === "pending").length} pending reports
          </div>
        </div>

        {/* Moderation Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-warning mb-2">
                {mockReportedContent.filter(r => r.status === "pending").length}
              </div>
              <p className="text-sm text-muted-foreground">Pending Reports</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-destructive mb-2">
                {mockReportedContent.filter(r => r.severity === "high").length}
              </div>
              <p className="text-sm text-muted-foreground">High Severity</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-destructive mb-2">
                {mockUserViolations.filter(u => u.status === "suspended").length}
              </div>
              <p className="text-sm text-muted-foreground">Suspended Users</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-destructive mb-2">
                {mockUserViolations.filter(u => u.status === "banned").length}
              </div>
              <p className="text-sm text-muted-foreground">Banned Users</p>
            </CardContent>
          </Card>
        </div>

        {/* Moderation Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">Reported Content</TabsTrigger>
            <TabsTrigger value="violations">User Violations</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            {/* Filters */}
            <Card className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="comment">Comment</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <Card key={report.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {getTypeIcon(report.type)}
                          </div>
                          <h3 className="text-lg font-semibold text-foreground truncate">{report.title}</h3>
                          <Badge className={`text-xs ${getStatusBadge(report.status)}`}>
                            {report.status}
                          </Badge>
                          <Badge className={`text-xs ${getSeverityBadge(report.severity)}`}>
                            {report.severity}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground mb-3">
                          <p><span className="font-medium">Reason:</span> {report.reason}</p>
                          <p><span className="font-medium">Description:</span> {report.description}</p>
                          <p><span className="font-medium">Reported by:</span> {report.reportedBy}</p>
                          {report.reportedUser && (
                            <p><span className="font-medium">Reported user:</span> {report.reportedUser}</p>
                          )}
                          <p><span className="font-medium">Reported at:</span> {formatDate(report.reportedAt)}</p>
                          {report.reviewedAt && (
                            <p><span className="font-medium">Reviewed at:</span> {formatDate(report.reviewedAt)} by {report.reviewedBy}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {report.status === "pending" && (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => handleApprove(report.id)}
                              className="bg-primary hover:bg-primary/90 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleReject(report.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
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
          </TabsContent>

          <TabsContent value="violations" className="space-y-6">
            {/* User Violations List */}
            <div className="space-y-3">
              {userViolations.map((violation) => (
                <Card key={violation.id} className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">{violation.username}</h3>
                          <Badge className={`text-xs ${getStatusBadge(violation.status)}`}>
                            {violation.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {violation.violationType}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground mb-3">
                          <p><span className="font-medium">Email:</span> {violation.email}</p>
                          <p><span className="font-medium">Description:</span> {violation.description}</p>
                          <p><span className="font-medium">Violation count:</span> {violation.violationCount}</p>
                          <p><span className="font-medium">Last violation:</span> {formatDate(violation.lastViolation)}</p>
                          <p><span className="font-medium">Actions taken:</span> {violation.actions.join(", ")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        {violation.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSuspendDialog(violation)}
                            disabled={actionLoading === violation.userId}
                          >
                            {actionLoading === violation.userId ? (
                              <Loader size="sm" className="mr-1" />
                            ) : (
                              <Ban className="h-4 w-4 mr-1" />
                            )}
                            Suspend
                          </Button>
                        )}
                        {violation.status === "suspended" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateUser(violation)}
                              disabled={actionLoading === violation.userId}
                            >
                              {actionLoading === violation.userId ? (
                                <Loader size="sm" className="mr-1" />
                              ) : (
                                <Shield className="h-4 w-4 mr-1" />
                              )}
                              Reactivate
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openBanDialog(violation)}
                              disabled={actionLoading === violation.userId}
                            >
                              {actionLoading === violation.userId ? (
                                <Loader size="sm" className="mr-1" />
                              ) : (
                                <Ban className="h-4 w-4 mr-1" />
                              )}
                              Ban
                            </Button>
                          </>
                        )}
                        {violation.status === "banned" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivateUser(violation)}
                            disabled={actionLoading === violation.userId}
                          >
                            {actionLoading === violation.userId ? (
                              <Loader size="sm" className="mr-1" />
                            ) : (
                              <Shield className="h-4 w-4 mr-1" />
                            )}
                            Unban
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Suspend User Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {selectedUser?.username}? They will be temporarily unable to access their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Reason (optional)
            </label>
            <Textarea
              placeholder="Enter reason for suspension..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              disabled={actionLoading !== null}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Suspending...
                </>
              ) : (
                "Suspend User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban User Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently ban {selectedUser?.username}? This action is severe and should only be used for repeated or serious violations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Reason (optional)
            </label>
            <Textarea
              placeholder="Enter reason for ban..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              disabled={actionLoading !== null}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {actionLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Banning...
                </>
              ) : (
                "Ban User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ModerationPage;
