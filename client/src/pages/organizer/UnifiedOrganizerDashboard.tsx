import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  DollarSign,
  Activity,
  Plus,
  BarChart3,
  ArrowUpRight,
  CheckCircle2,
  Shield,
  X,
  Lock,
  AlertCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OrganizerEventCard from "@/components/OrganizerEventCard";
import { SubscriptionTierBadge } from "@/components/organizer/SubscriptionTierBadge";
import { UpgradePrompt } from "@/components/organizer/UpgradePrompt";
import { CustomAreaChart } from "@/components/charts/ChartComponents";
import { DashboardSkeleton } from "@/components/loaders/DashboardSkeleton";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/hooks/useAuth";
import {
  useOrganizerDashboardStats,
  useOrganizerDashboardEvents,
  useOrganizerSubscription,
  useOrganizerDashboardAccess,
} from "@/hooks/queries/useOrganizerDashboardData";
import { useOrganizerRevenueAnalytics } from "@/hooks/queries/useOrganizerRevenueAnalytics";
import type { OrganizerDashboardEvent } from "@/lib/organizer-api";

const UnifiedOrganizerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationReminder, setVerificationReminder] = useState<string | null>(null);
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);

  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [allEvents, setAllEvents] = useState<OrganizerDashboardEvent[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // React Query hooks
  const { data: stats, isLoading: statsLoading } = useOrganizerDashboardStats();
  const { data: eventsData, isLoading: eventsLoading } = useOrganizerDashboardEvents(page);
  const { data: subscription, isLoading: subscriptionLoading } = useOrganizerSubscription();
  const { data: accessData } = useOrganizerDashboardAccess();
  const { data: revenueData } = useOrganizerRevenueAnalytics();

  // Accumulate events across pages for infinite scroll
  useEffect(() => {
    if (eventsData?.events) {
      if (page === 1) {
        setAllEvents(eventsData.events);
      } else {
        setAllEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = eventsData.events.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
      }
    }
  }, [eventsData, page]);

  // Check for messages from navigation state (e.g., after event creation)
  useEffect(() => {
    const state = location.state as {
      message?: string;
      verificationReminder?: string;
      eventCreated?: boolean;
      needsVerification?: boolean;
    } | null;

    if (state?.message) {
      setSuccessMessage(state.message);
      window.history.replaceState({}, document.title);
    }

    if (state?.verificationReminder && state?.needsVerification) {
      setVerificationReminder(state.verificationReminder);
      setShowVerificationReminder(true);
    }
  }, [location.state]);

  // Intersection Observer for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (eventsData?.hasMore && !eventsLoading) {
      setPage((prev) => prev + 1);
    }
  }, [eventsData?.hasMore, eventsLoading]);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  // Stats card definitions
  const statCards = [
    {
      title: "Total Events",
      value: stats?.totalEvents ?? 0,
      gradient: "from-emerald-500 to-emerald-600",
      icon: Calendar,
    },
    {
      title: "Total Attendees",
      value: stats?.totalAttendees ?? 0,
      gradient: "from-indigo-500 to-indigo-600",
      icon: Users,
    },
    {
      title: "Total Revenue",
      value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`,
      gradient: "from-amber-500 to-orange-500",
      icon: DollarSign,
    },
    {
      title: "Health Score",
      value: stats?.healthScore?.overall ?? 0,
      gradient: "from-violet-500 to-violet-600",
      icon: Activity,
    },
  ];

  // Pending events from access data
  const pendingEvents = accessData?.pendingEvents ?? [];
  const hasPendingEvents = pendingEvents.length > 0;

  // Urgent deadlines (≤3 days)
  const urgentDeadlines = (stats?.upcomingDeadlines ?? []).filter(
    (d) => d.daysRemaining <= 3
  );

  // Revenue chart data
  const revenueChartData = revenueData?.summary?.dailyRevenue ?? revenueData?.summary?.monthlyRevenue ?? [];

  // Helper functions for deadlines
  const formatDeadlineType = (type: string) => {
    switch (type) {
      case "registration_deadline":
        return "Registration Deadline";
      case "early_bird_pricing":
        return "Early Bird Pricing";
      case "speaker_confirmation":
        return "Speaker Confirmations";
      case "abstract_submission":
        return "Abstract Submissions";
      default:
        return type
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const formatDaysRemaining = (days: number) => {
    if (days < 7) {
      return `${days} ${days === 1 ? "day" : "days"}`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
    } else {
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? "month" : "months"}`;
    }
  };

  if (statsLoading) {
    return (
      <div className="bg-gradient-to-br from-background via-background to-muted/20">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20">
      <div>
        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 border-success/20 bg-success-light">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Reminder */}
        {showVerificationReminder && verificationReminder && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-foreground flex-1">
                <strong>Verification Required:</strong> {verificationReminder}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate("/organizer/verification", {
                      state: {
                        redirectAfterVerification: "/organizer/dashboard",
                      },
                    });
                  }}
                >
                  Verify Identity
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVerificationReminder(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Completion Nudge */}
        {user && !user.profileCompleted && (
          <Alert className="mb-6 border-amber-500/20 bg-amber-500/5">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-foreground flex-1">
                <strong>Complete your organizer profile</strong> to build trust with attendees and improve your event visibility.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/organizer/profile-setup")}
                className="border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              >
                Set Up Profile
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-page-title">Dashboard</h1>
              {!subscriptionLoading && subscription && (
                <SubscriptionTierBadge tier={subscription.tier} size="sm" />
              )}
            </div>
            <p className="text-page-subtitle">
              Welcome back! Here's what's happening with your events.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/organizer/events/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Upgrade Prompt for BASIC tier */}
        {!subscriptionLoading && subscription?.tier === "BASIC" && (
          <div className="mb-6">
            <UpgradePrompt
              message="Upgrade to Standard (free) to access attendee contact information and manage your event communications."
              targetTier="STANDARD"
              variant="banner"
              dismissible={true}
            />
          </div>
        )}

        {/* Premium Expiry Warning */}
        {!subscriptionLoading &&
          subscription?.tier === "PREMIUM" &&
          subscription?.expiresAt &&
          (() => {
            const expiryDate = new Date(subscription.expiresAt);
            const daysUntilExpiry = Math.ceil(
              (expiryDate.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
              return (
                <Alert className="mb-6 border-destructive/20 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-foreground flex-1">
                      <strong>Premium Subscription Expiring:</strong> Your
                      Premium subscription expires in {daysUntilExpiry}{" "}
                      {daysUntilExpiry === 1 ? "day" : "days"} on{" "}
                      {expiryDate.toLocaleDateString()}.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/organizer/subscription")}
                    >
                      Manage Subscription
                    </Button>
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })()}

        {/* Stats Cards — Admin-style gradient cards */}
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`flex-shrink-0 w-16 h-16 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <stat.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Attention Strip — Pending events or urgent deadlines */}
        {(hasPendingEvents || urgentDeadlines.length > 0) && (
          <section className="mb-8 space-y-3">
            {hasPendingEvents && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex-1">
                  You have {pendingEvents.length}{" "}
                  {pendingEvents.length === 1 ? "event" : "events"} pending
                  approval
                </p>
                <Link
                  to="/organizer/events"
                  className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                >
                  View events
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
            {urgentDeadlines.length > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200 flex-1">
                  {urgentDeadlines.length} urgent{" "}
                  {urgentDeadlines.length === 1 ? "deadline" : "deadlines"}{" "}
                  within 3 days
                </p>
              </div>
            )}
          </section>
        )}

        <div className="space-y-8">
          {/* Revenue Chart */}
          <Card className="rounded-2xl border border-border/40 bg-card shadow-lg">
            <CardHeader className="border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Revenue Overview
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {revenueChartData.length > 0 ? (
                <CustomAreaChart
                  data={revenueChartData}
                  dataKey="revenue"
                  xAxisKey="date"
                  height={300}
                  formatter={(value) =>
                    `$${Number(value).toLocaleString()}`
                  }
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-3">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Revenue data will appear once your first event gets ticket
                    sales
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Insights */}
            <Card className="border border-border/40 bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="border-b border-border/40">
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Best Performing Event
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.performanceInsights?.bestPerformingEvent?.title ??
                        "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {stats?.performanceInsights?.bestPerformingEvent?.conversionRate.toFixed(
                        1
                      ) ?? "0"}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Total Revenue Growth
                    </p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        (stats?.performanceInsights?.revenueGrowth
                          .percentage ?? 0) >= 0
                          ? "text-primary"
                          : "text-destructive"
                      }`}
                    >
                      {(stats?.performanceInsights?.revenueGrowth.percentage ??
                        0) >= 0
                        ? "+"
                        : ""}
                      {stats?.performanceInsights?.revenueGrowth.percentage.toFixed(
                        0
                      ) ?? "0"}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">
                      vs last month
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Average Attendance
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.performanceInsights?.averageAttendance
                        .totalEvents ?? 0}{" "}
                      events
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {stats?.performanceInsights?.averageAttendance.percentage.toFixed(
                        1
                      ) ?? "0"}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">capacity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="border border-border/40 bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="border-b border-border/40">
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {(stats?.upcomingDeadlines ?? []).length > 0 ? (
                  (stats?.upcomingDeadlines ?? [])
                    .slice(0, 3)
                    .map((deadline, index) => {
                      const isUrgent = deadline.daysRemaining <= 7;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {formatDeadlineType(deadline.type)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {deadline.eventTitle}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-bold ${
                                isUrgent
                                  ? "text-destructive"
                                  : "text-primary"
                              }`}
                            >
                              {formatDaysRemaining(deadline.daysRemaining)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              left
                            </p>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No upcoming deadlines
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Health Score */}
            <Card className="border border-border/40 bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="border-b border-border/40">
                <CardTitle>Event Health Score</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mb-2">
                    <span className="text-xl font-bold text-white">
                      {stats?.healthScore?.overall ?? 0}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Overall Health
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Registration Rate
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${Math.min(
                              stats?.healthScore?.components
                                .registrationRate ?? 0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats?.healthScore?.components.registrationRate?.toFixed(
                          0
                        ) ?? 0}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Speaker Confirmation
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${Math.min(
                              stats?.healthScore?.components
                                .speakerConfirmation ?? 0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats?.healthScore?.components.speakerConfirmation?.toFixed(
                          0
                        ) ?? 0}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Sponsor Engagement
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${Math.min(
                              stats?.healthScore?.components
                                .sponsorEngagement ?? 0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats?.healthScore?.components.sponsorEngagement?.toFixed(
                          0
                        ) ?? 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border border-border/40 bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <h3 className="text-card-title mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center p-4 border border-border/40 rounded-lg bg-card">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Total Events</p>
                    <p className="text-sm text-muted-foreground">
                      {stats?.totalEvents ?? 0}{" "}
                      {(stats?.totalEvents ?? 0) === 1 ? "event" : "events"}
                    </p>
                  </div>
                </div>

                <Link
                  to="/organizer/analytics"
                  className="flex items-center p-4 border border-border/40 rounded-lg hover:border-primary/30 hover:bg-muted transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      View Analytics
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Performance insights
                    </p>
                  </div>
                </Link>

                <Link
                  to="/organizer/attendees"
                  className={`flex items-center p-4 border border-border/40 rounded-lg hover:border-primary/30 hover:bg-muted transition-colors duration-200 ${
                    subscription?.tier === "BASIC" ? "relative" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      Manage Attendees
                      {subscription?.tier === "BASIC" && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.tier === "BASIC"
                        ? "Upgrade to view"
                        : "View and manage"}
                    </p>
                  </div>
                </Link>

                <Link
                  to="/organizer/tickets/scanner"
                  className="flex items-center p-4 border border-border/40 rounded-lg hover:border-primary/30 hover:bg-muted transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Ticket Scanner
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check-in attendees
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Events Grid */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-section-header">My Events</h2>
              <Link
                to="/organizer/events"
                className="text-primary hover:text-primary/80 font-medium text-sm flex items-center transition-colors"
              >
                View all events
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {eventsLoading && page === 1 ? (
              <div className="text-center py-8">
                <Loader size="default" />
                <p className="text-muted-foreground mt-4">Loading events...</p>
              </div>
            ) : allEvents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allEvents.map((event) => (
                    <OrganizerEventCard key={event.id} event={event} />
                  ))}
                </div>
                {/* Infinite Scroll Loader */}
                {eventsData?.hasMore && (
                  <div ref={loadMoreRef} className="py-8 text-center">
                    {eventsLoading && page > 1 && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader size="sm" />
                        <span>Loading more events...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No events yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first event to start seeing stats, attendees, and
                  revenue on your dashboard.
                </p>
                <Button
                  onClick={() => navigate("/organizer/events/create")}
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedOrganizerDashboard;
