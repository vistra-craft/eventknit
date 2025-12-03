import { useState } from "react";
import { CheckCircle, XCircle, Eye, Ban, User, Flag, MessageSquare, Calendar, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "./AdminLayout";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      reviewed: "bg-blue-100 text-blue-800 border-blue-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      active: "bg-green-100 text-green-800 border-green-200",
      suspended: "bg-yellow-100 text-yellow-800 border-yellow-200",
      banned: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-red-100 text-red-800 border-red-200"
    };
    return variants[severity as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200";
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
    // TODO: Implement approval logic
  };

  const handleReject = (reportId: string) => {
    console.log("Rejecting report:", reportId);
    // TODO: Implement rejection logic
  };

  const handleSuspendUser = (userId: string) => {
    console.log("Suspending user:", userId);
    // TODO: Implement user suspension logic
  };

  const handleBanUser = (userId: string) => {
    console.log("Banning user:", userId);
    // TODO: Implement user ban logic
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Content Moderation</h1>
            <p className="text-gray-600">Review and manage reported content and user violations</p>
          </div>
          <div className="text-sm text-gray-500">
            {filteredReports.filter(r => r.status === "pending").length} pending reports
          </div>
        </div>

        {/* Moderation Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-yellow-600 mb-2">
                {mockReportedContent.filter(r => r.status === "pending").length}
              </div>
              <p className="text-sm text-gray-600">Pending Reports</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-red-600 mb-2">
                {mockReportedContent.filter(r => r.severity === "high").length}
              </div>
              <p className="text-sm text-gray-600">High Severity</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-orange-600 mb-2">
                {mockUserViolations.filter(u => u.status === "suspended").length}
              </div>
              <p className="text-sm text-gray-600">Suspended Users</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <div className="font-semibold text-red-600 mb-2">
                {mockUserViolations.filter(u => u.status === "banned").length}
              </div>
              <p className="text-sm text-gray-600">Banned Users</p>
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
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                <Card key={report.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
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
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
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
                              className="bg-green-600 hover:bg-green-700"
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
              {mockUserViolations.map((violation) => (
                <Card key={violation.id} className="border-border bg-card hover:shadow-md transition-all duration-200">
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
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
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
                            onClick={() => handleSuspendUser(violation.userId)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                        {violation.status === "suspended" && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleBanUser(violation.userId)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
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
    </AdminLayout>
  );
};

export default ModerationPage;
