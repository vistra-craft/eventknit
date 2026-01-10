import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Star,
  Calendar,
  Filter,
  Mail,
  Eye,
  Minus,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import AdminLayout from "./AdminLayout";
import {
  getAllFeedback,
  getFeedbackAnalytics,
  getFeedbackById,
  addAdminNotes,
  triggerFeedbackEmails,
  Feedback,
  FeedbackAnalytics,
  FeedbackFilters,
} from "@/lib/feedback-api";
import { useToast } from "@/hooks/useToast";

const PlatformFeedbackPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FeedbackFilters>({
    page: 1,
    limit: 20,
  });
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [triggerEventId, setTriggerEventId] = useState("");
  const [triggering, setTriggering] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feedbackRes, analyticsRes] = await Promise.all([
        getAllFeedback(filters),
        getFeedbackAnalytics(),
      ]);

      if (feedbackRes.success && feedbackRes.data) {
        setFeedback(feedbackRes.data.feedback || []);
        setTotalPages(feedbackRes.data.totalPages || 1);
        setCurrentPage(feedbackRes.data.page || 1);
      }

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await getFeedbackById(id);
      if (res.success && res.data?.feedback) {
        setSelectedFeedback(res.data.feedback);
        setAdminNotes(res.data.feedback.adminNotes || "");
        setDetailsOpen(true);
      }
    } catch (error) {
      console.error("Error fetching feedback details:", error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedFeedback) return;

    try {
      setSavingNotes(true);
      await addAdminNotes(selectedFeedback.id, adminNotes);
      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
      fetchData();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleTriggerEmails = async () => {
    if (!triggerEventId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an event ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setTriggering(true);
      const res = await triggerFeedbackEmails(triggerEventId.trim());
      if (res.success) {
        toast({
          title: "Success",
          description: `Feedback emails sent: ${res.data?.attendees?.sent || 0} attendees, ${res.data?.organizer ? "1 organizer" : "0 organizers"}`,
        });
        setTriggerEventId("");
      }
    } catch (error) {
      console.error("Error triggering emails:", error);
      toast({
        title: "Error",
        description: "Failed to trigger feedback emails",
        variant: "destructive",
      });
    } finally {
      setTriggering(false);
    }
  };

  const getNpsColor = (score: number) => {
    if (score >= 9) return "text-success bg-success/10";
    if (score >= 7) return "text-warning bg-warning/10";
    return "text-destructive bg-destructive/10";
  };

  const getNpsCategory = (score: number) => {
    if (score >= 9) return "Promoter";
    if (score >= 7) return "Passive";
    return "Detractor";
  };

  const renderNpsGauge = (score: number) => {
    const color = score >= 50 ? "text-success" : score >= 0 ? "text-warning" : "text-destructive";

    return (
      <div className="flex items-center gap-2">
        <div className="text-3xl font-bold">{score}</div>
        <div className={`text-sm ${color}`}>
          {score >= 50 ? (
            <TrendingUp className="h-5 w-5" />
          ) : score >= 0 ? (
            <Minus className="h-5 w-5" />
          ) : (
            <TrendingDown className="h-5 w-5" />
          )}
        </div>
      </div>
    );
  };

  if (loading && !analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-foreground">Platform Feedback</h1>
          <p className="text-muted-foreground">
            Monitor NPS scores and feedback from attendees and organizers
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">All Responses</TabsTrigger>
          <TabsTrigger value="trigger">Trigger Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* NPS Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  NPS Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && renderNpsGauge(analytics.npsScore)}
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {analytics?.totalResponses || 0} responses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-warning fill-warning" />
                  <span className="text-3xl font-bold">
                    {analytics?.averageNps?.toFixed(1) || 0}
                  </span>
                  <span className="text-muted-foreground">/10</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Would Use Again
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">
                  {analytics?.retention?.wouldUseAgain || 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Would Recommend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {analytics?.retention?.wouldRecommend || 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NPS Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>NPS Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {analytics?.distribution?.promoters || 0}
                  </div>
                  <div className="text-sm text-success">Promoters (9-10)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics?.totalResponses
                      ? Math.round(
                          ((analytics.distribution?.promoters || 0) /
                            analytics.totalResponses) *
                            100
                        )
                      : 0}
                    %
                  </div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {analytics?.distribution?.passives || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Passives (7-8)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics?.totalResponses
                      ? Math.round(
                          ((analytics.distribution?.passives || 0) /
                            analytics.totalResponses) *
                            100
                        )
                      : 0}
                    %
                  </div>
                </div>
                <div className="text-center p-4 bg-destructive/10 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {analytics?.distribution?.detractors || 0}
                  </div>
                  <div className="text-sm text-destructive">Detractors (0-6)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics?.totalResponses
                      ? Math.round(
                          ((analytics.distribution?.detractors || 0) /
                            analytics.totalResponses) *
                            100
                        )
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Event Quality", value: analytics?.categoryAverages?.eventQuality || 0 },
                  { label: "Platform Usability", value: analytics?.categoryAverages?.platformUsability || 0 },
                  { label: "Registration Process", value: analytics?.categoryAverages?.registrationProcess || 0 },
                  { label: "Communication Quality", value: analytics?.categoryAverages?.communicationQuality || 0 },
                ].map((category) => (
                  <div key={category.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{category.label}</span>
                      <span className="font-medium">{category.value.toFixed(1)}/5</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(category.value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Areas</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.improvementAreas?.length ? (
                  <div className="space-y-2">
                    {analytics.improvementAreas.slice(0, 5).map((item) => (
                      <div
                        key={item.area}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span className="capitalize">{item.area.replace(/_/g, " ")}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No improvement areas reported yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feedback by User Type */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback by User Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {analytics?.byUserType?.map((item) => (
                  <div
                    key={item.userType}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium capitalize">{item.userType.toLowerCase()}s</div>
                        <div className="text-sm text-muted-foreground">
                          {item.count} responses
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.averageNps.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">avg NPS</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <Label>User Type</Label>
                  <Select
                    value={filters.userType || "all"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        userType: value === "all" ? undefined : (value as "ATTENDEE" | "ORGANIZER"),
                        page: 1,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="ATTENDEE">Attendees</SelectItem>
                      <SelectItem value="ORGANIZER">Organizers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <Label>Min NPS</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="0"
                    value={filters.minNps || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minNps: e.target.value ? parseInt(e.target.value) : undefined,
                        page: 1,
                      })
                    }
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <Label>Max NPS</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="10"
                    value={filters.maxNps || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxNps: e.target.value ? parseInt(e.target.value) : undefined,
                        page: 1,
                      })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ page: 1, limit: 20 })}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader />
                </div>
              ) : feedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No feedback found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getNpsColor(item.npsScore)}>
                            NPS: {item.npsScore}
                          </Badge>
                          <Badge variant="outline">
                            {getNpsCategory(item.npsScore)}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {item.userType.toLowerCase()}
                          </Badge>
                          <Badge variant="outline">
                            {item.submittedVia === "EMAIL" ? (
                              <><Mail className="h-3 w-3 mr-1" /> Email</>
                            ) : (
                              "Platform"
                            )}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">
                            {item.user?.firstName} {item.user?.lastName}
                          </span>
                          <span className="text-muted-foreground"> - </span>
                          <span className="text-muted-foreground">{item.user?.email}</span>
                        </div>
                        {item.event && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {item.event.title}
                          </div>
                        )}
                        {item.comment && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            "{item.comment}"
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(item.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trigger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trigger Feedback Emails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Send feedback request emails to attendees and organizers for a specific event.
                This is typically done automatically after an event ends, but can be triggered manually.
              </p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Event ID</Label>
                  <Input
                    placeholder="Enter event ID"
                    value={triggerEventId}
                    onChange={(e) => setTriggerEventId(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleTriggerEmails}
                    disabled={triggering || !triggerEventId.trim()}
                  >
                    {triggering ? (
                      <>
                        <Loader size="sm" className="mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Feedback Requests
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">
                    {selectedFeedback.user?.firstName} {selectedFeedback.user?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFeedback.user?.email}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Event</Label>
                  <p className="font-medium">{selectedFeedback.event?.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">NPS Score</Label>
                  <Badge className={`${getNpsColor(selectedFeedback.npsScore)} text-lg`}>
                    {selectedFeedback.npsScore}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">User Type</Label>
                  <p className="capitalize">{selectedFeedback.userType.toLowerCase()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted Via</Label>
                  <p>{selectedFeedback.submittedVia}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p>{new Date(selectedFeedback.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedFeedback.comment && (
                <div>
                  <Label className="text-muted-foreground">Comment</Label>
                  <p className="p-3 bg-muted rounded-lg">{selectedFeedback.comment}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Event Quality</Label>
                  <p>{selectedFeedback.eventQuality || "-"}/5</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Platform Usability</Label>
                  <p>{selectedFeedback.platformUsability || "-"}/5</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registration Process</Label>
                  <p>{selectedFeedback.registrationProcess || "-"}/5</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Communication Quality</Label>
                  <p>{selectedFeedback.communicationQuality || "-"}/5</p>
                </div>
              </div>

              {selectedFeedback.improvementAreas?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Improvement Areas</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedFeedback.improvementAreas.map((area) => (
                      <Badge key={area} variant="outline" className="capitalize">
                        {area.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Would Use Again</Label>
                  <p>
                    {selectedFeedback.wouldUseAgain === true
                      ? "Yes"
                      : selectedFeedback.wouldUseAgain === false
                      ? "No"
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Would Recommend</Label>
                  <p>
                    {selectedFeedback.wouldRecommend === true
                      ? "Yes"
                      : selectedFeedback.wouldRecommend === false
                      ? "No"
                      : "-"}
                  </p>
                </div>
              </div>

              <div>
                <Label>Admin Notes</Label>
                <Textarea
                  placeholder="Add notes about this feedback..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
                <Button
                  className="mt-2"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Notes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PlatformFeedbackPage;
