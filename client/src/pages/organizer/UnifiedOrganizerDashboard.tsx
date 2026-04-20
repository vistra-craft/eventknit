import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  DollarSign,
  Activity,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Shield,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OrganizerEventCard from '@/components/organizer-ui/OrganizerEventCard';
import { SubscriptionTierBadge } from "@/components/organizer/SubscriptionTierBadge";
import { UpgradePrompt } from "@/components/organizer/UpgradePrompt";
import { DashboardSkeleton } from "@/components/loaders/DashboardSkeleton";
import { Loader } from "@/components/ui/loader";
import { OrganizerWelcomeScreen } from '@/components/organizer-ui/OrganizerWelcomeScreen';
import { useAuth } from "@/hooks/useAuth";
import {
  useOrganizerDashboardStats,
  useOrganizerDashboardEvents,
  useOrganizerSubscription,
  useOrganizerDashboardAccess,
} from "@/hooks/queries/useOrganizerDashboardData";
import type { OrganizerDashboardEvent } from "@/lib/organizer-api";
import { getVerificationStatus, type VerificationStatus } from "@/lib/verification-api";

const UnifiedOrganizerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationReminder, setVerificationReminder] = useState<string | null>(null);
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [kycBannerDismissed, setKycBannerDismissed] = useState(
    () => sessionStorage.getItem('kyc_banner_dismissed') === 'true'
  );
  const [showKYCPrompt, setShowKYCPrompt] = useState(false);
  const [kycPromptEventTitle, setKycPromptEventTitle] = useState<string | null>(null);

  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [allEvents, setAllEvents] = useState<OrganizerDashboardEvent[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // React Query hooks
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useOrganizerDashboardStats();
  const { data: eventsData, isLoading: eventsLoading } = useOrganizerDashboardEvents(page);
  const { data: subscription, isLoading: subscriptionLoading } = useOrganizerSubscription();
  const { data: accessData } = useOrganizerDashboardAccess();

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
      showKYCPrompt?: boolean;
      eventTitle?: string;
    } | null;

    if (state?.message) {
      setSuccessMessage(state.message);
      window.history.replaceState({}, document.title);
    }

    if (state?.verificationReminder && state?.needsVerification) {
      setVerificationReminder(state.verificationReminder);
      setShowVerificationReminder(true);
    }

    if (state?.showKYCPrompt) {
      setShowKYCPrompt(true);
      setKycPromptEventTitle(state.eventTitle ?? null);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load verification status once on mount
  useEffect(() => {
    getVerificationStatus()
      .then((res) => {
        if (res.success && res.data) setVerificationStatus(res.data);
      })
      .catch(() => { /* non-critical — banner simply won't show */ });
  }, []);

  // Intersection Observer for infinite scroll — ref pattern prevents useEffect loop
  const handleLoadMore = useCallback(() => {
    if (eventsData?.hasMore && !eventsLoading) {
      setPage((prev) => prev + 1);
    }
  }, [eventsData?.hasMore, eventsLoading]);

  const handleLoadMoreRef = useRef(handleLoadMore);
  handleLoadMoreRef.current = handleLoadMore;

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMoreRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, []); // stable — observer reads latest handleLoadMore via ref

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

  if (statsLoading) {
    return (
      <div className="bg-gradient-to-br from-background via-background to-muted/20">
        <DashboardSkeleton />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button variant="outline" onClick={() => void refetchStats()}>Try again</Button>
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

        {/* KYC Required Prompt — shown after paid event creation for unverified organizers */}
        {showKYCPrompt && (
          <Alert className="mb-6 border-amber-500/30 bg-amber-500/8">
            <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-foreground">Account verification required</p>
                <p className="text-sm text-muted-foreground">
                  {kycPromptEventTitle
                    ? <>Your event <span className="font-medium text-foreground">&ldquo;{kycPromptEventTitle}&rdquo;</span> is pending review. </>
                    : 'Your event is pending review. '}
                  To make it visible to our review team, please complete your KYC verification. It only takes a few minutes.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => navigate('/organizer/settings/kyc')}
                >
                  Complete KYC
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKYCPrompt(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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

        {/* KYC Pending Badge — visible once submitted, while under review (not yet approved or rejected) */}
        {!kycBannerDismissed && verificationStatus?.identityVerified && verificationStatus?.kycStatus === 'PENDING' && (
          <Alert className="mb-6 border-amber-500/20 bg-amber-500/5">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-foreground flex-1">
                <strong>KYC verification in progress</strong> — your documents are under review. Payouts will be enabled once approved.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  sessionStorage.setItem('kyc_banner_dismissed', 'true');
                  setKycBannerDismissed(true);
                }}
              >
                <X className="h-4 w-4" />
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Profile & Verification Setup Section — moved here for better flow */}
        <section className="mb-8 space-y-3">
          {/* Profile Completion Nudge */}
          {user && !user.profileCompleted && (
            <Alert className="border-amber-500/20 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-foreground flex-1">
                  <strong>Complete your organizer profile</strong> to build trust with attendees and improve your event visibility.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/organizer/profile-setup")}
                  className="border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shrink-0"
                >
                  Set Up Profile
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* KYC Rejected — shown only when admin has rejected KYC documents */}
          {verificationStatus?.kycStatus === 'REJECTED' && (
            <Alert className="border-destructive/20 bg-destructive/5">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex-1">
                  <strong className="text-destructive">KYC verification rejected</strong>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Your KYC documents were reviewed and rejected. Please update your documents and resubmit to enable payouts on paid events.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => navigate("/organizer/settings/kyc")}
                >
                  Update Documents
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </section>
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
      {/* Welcome screen for newly promoted organizers */}
      <OrganizerWelcomeScreen />
    </div>
  );
};

export default UnifiedOrganizerDashboard;
