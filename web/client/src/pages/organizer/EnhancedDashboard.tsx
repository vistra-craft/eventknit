import { useState, useEffect } from "react";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Plus,
  BarChart3,
  ArrowUpRight,
  CheckCircle2,
  Shield,
  X,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import OrganizerEventCard from "../../components/OrganizerEventCard";
import { getOrganizerDashboardStats, getOrganizerDashboardEvents, getSubscription, type OrganizerDashboardEvent, type OrganizerSubscription, type DashboardAccessTier } from "../../lib/organizer-api";
import { SubscriptionTierBadge } from "../../components/organizer/SubscriptionTierBadge";
import { UpgradePrompt } from "../../components/organizer/UpgradePrompt";

interface EnhancedDashboardProps {
  tier?: DashboardAccessTier;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("30d");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationReminder, setVerificationReminder] = useState<string | null>(null);
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [recentEvents, setRecentEvents] = useState<OrganizerDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  
  // Subscription state
  const [subscription, setSubscription] = useState<OrganizerSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  
  // New state for dashboard insights
  const [performanceInsights, setPerformanceInsights] = useState<{
    bestPerformingEvent: { id: string; title: string; conversionRate: number } | null;
    revenueGrowth: { percentage: number; period: string };
    averageAttendance: { percentage: number; totalEvents: number };
  } | null>(null);
  
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Array<{
    type: string;
    eventId: string;
    eventTitle: string;
    deadlineDate: string;
    daysRemaining: number;
  }>>([]);
  
  const [healthScore, setHealthScore] = useState<{
    overall: number;
    components: {
      registrationRate: number;
      speakerConfirmation: number;
      sponsorEngagement: number;
    };
  } | null>(null);

  const fetchDashboardEvents = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      }

      const eventsResponse = await getOrganizerDashboardEvents({ page: pageNum, limit: 12 });

      if (eventsResponse.success && eventsResponse.data) {
        if (append) {
          setRecentEvents(prev => [...prev, ...eventsResponse.data.events]);
        } else {
          setRecentEvents(eventsResponse.data.events);
        }

        setHasMore(eventsResponse.data.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching dashboard events:", error);
    } finally {
      setLoadingMore(false);
    }
  };

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
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
    
    if (state?.verificationReminder && state?.needsVerification) {
      setVerificationReminder(state.verificationReminder);
      setShowVerificationReminder(true);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setSubscriptionLoading(true);
        const [statsResponse, eventsResponse, subscriptionResponse] = await Promise.all([
          getOrganizerDashboardStats(),
          getOrganizerDashboardEvents({ page: 1, limit: 12 }),
          getSubscription(),
        ]);

        if (statsResponse.success && statsResponse.data.stats) {
          const dashboardStats = statsResponse.data.stats;
          setTotalEvents(dashboardStats.totalEvents);
          
          // Set performance insights
          if (dashboardStats.performanceInsights) {
            setPerformanceInsights(dashboardStats.performanceInsights);
          }
          
          // Set upcoming deadlines
          if (dashboardStats.upcomingDeadlines) {
            setUpcomingDeadlines(dashboardStats.upcomingDeadlines);
          }
          
          // Set health score
          if (dashboardStats.healthScore) {
            setHealthScore(dashboardStats.healthScore);
          }
        }

        if (eventsResponse.success && eventsResponse.data) {
          setRecentEvents(eventsResponse.data.events);
          setHasMore(eventsResponse.data.hasMore || false);
          setPage(1);
        }
        
        if (subscriptionResponse.success && subscriptionResponse.data) {
          setSubscription(subscriptionResponse.data.subscription);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
        setSubscriptionLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchDashboardEvents(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, page]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8">
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
                    navigate('/organizer/verification', {
                      state: { redirectAfterVerification: '/organizer/dashboard' }
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-page-title">Dashboard Overview</h1>
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
        {!subscriptionLoading && subscription?.tier === 'BASIC' && (
          <div className="mb-6">
            <UpgradePrompt
              message="Upgrade to Standard (free) to access attendee contact information and manage your event communications."
              targetTier="STANDARD"
              variant="banner"
              dismissible={true}
            />
          </div>
        )}

        {/* Subscription Expiry Warning for Premium */}
        {!subscriptionLoading && subscription?.tier === 'PREMIUM' && subscription?.expiresAt && (
          (() => {
            const expiryDate = new Date(subscription.expiresAt);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
              return (
                <Alert className="mb-6 border-destructive/20 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-foreground flex-1">
                      <strong>Premium Subscription Expiring:</strong> Your Premium subscription expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'} on {expiryDate.toLocaleDateString()}.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/organizer/subscription')}
                    >
                      Manage Subscription
                    </Button>
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })()
        )}


        {/* Main Content */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card className="border border-border bg-card-surface rounded-2xl shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <h3 className="text-card-title mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center p-4 border border-border rounded-lg bg-card-surface">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Total Events</p>
                    <p className="text-sm text-muted-foreground">{totalEvents} {totalEvents === 1 ? 'event' : 'events'}</p>
                  </div>
                </div>

                <Link
                  to="/organizer/analytics"
                  className="flex items-center p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-muted transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">View Analytics</p>
                    <p className="text-sm text-muted-foreground">Performance insights</p>
                  </div>
                </Link>

                <Link
                  to="/organizer/attendees"
                  className={`flex items-center p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-muted transition-colors duration-200 ${subscription?.tier === 'BASIC' ? 'relative' : ''}`}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      Manage Attendees
                      {subscription?.tier === 'BASIC' && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.tier === 'BASIC' ? 'Upgrade to view' : 'View and manage'}
                    </p>
                  </div>
                </Link>

                <Link
                  to="/organizer/tickets/scanner"
                  className="flex items-center p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-muted transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Ticket Scanner</p>
                    <p className="text-sm text-muted-foreground">Check-in attendees</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Insights Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Insights */}
            <Card className="border border-border bg-card-surface rounded-2xl shadow-md hover:shadow-lg transition-all">
              <CardHeader className="border-b border-border">
                <CardTitle>
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Best Performing Event</p>
                    <p className="text-xs text-muted-foreground">
                      {performanceInsights?.bestPerformingEvent?.title || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {performanceInsights?.bestPerformingEvent?.conversionRate.toFixed(1) || '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Total Revenue Growth</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${(performanceInsights?.revenueGrowth.percentage || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {(performanceInsights?.revenueGrowth.percentage || 0) >= 0 ? '+' : ''}
                      {performanceInsights?.revenueGrowth.percentage.toFixed(0) || '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground">vs last month</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Average Attendance</p>
                    <p className="text-xs text-muted-foreground">
                      {performanceInsights?.averageAttendance.totalEvents || 0} events
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {performanceInsights?.averageAttendance.percentage.toFixed(1) || '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground">capacity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="border border-border bg-card-surface rounded-2xl shadow-md hover:shadow-lg transition-all">
              <CardHeader className="border-b border-border">
                <CardTitle>
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.slice(0, 3).map((deadline, index) => {
                    const formatDeadlineType = (type: string) => {
                      switch (type) {
                        case 'registration_deadline':
                          return 'Registration Deadline';
                        case 'early_bird_pricing':
                          return 'Early Bird Pricing';
                        case 'speaker_confirmation':
                          return 'Speaker Confirmations';
                        case 'abstract_submission':
                          return 'Abstract Submissions';
                        default:
                          return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      }
                    };

                    const formatDaysRemaining = (days: number) => {
                      if (days < 7) {
                        return `${days} ${days === 1 ? 'day' : 'days'}`;
                      } else if (days < 30) {
                        const weeks = Math.floor(days / 7);
                        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
                      } else {
                        const months = Math.floor(days / 30);
                        return `${months} ${months === 1 ? 'month' : 'months'}`;
                      }
                    };

                    const isUrgent = deadline.daysRemaining <= 7;

                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {formatDeadlineType(deadline.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">{deadline.eventTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
                            {formatDaysRemaining(deadline.daysRemaining)}
                          </p>
                          <p className="text-xs text-muted-foreground">left</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Health Score */}
            <Card className="border border-border bg-card-surface rounded-2xl shadow-md hover:shadow-lg transition-all">
              <CardHeader className="border-b border-border">
                <CardTitle>
                  Event Health Score
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mb-2">
                    <span className="text-xl font-bold text-white">
                      {healthScore?.overall || 0}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Health</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Registration Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${Math.min(healthScore?.components.registrationRate || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {healthScore?.components.registrationRate.toFixed(0) || 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Speaker Confirmation</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${Math.min(healthScore?.components.speakerConfirmation || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {healthScore?.components.speakerConfirmation.toFixed(0) || 0}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sponsor Engagement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div
                          className={`h-full rounded-full ${(healthScore?.components.sponsorEngagement || 0) >= 90 ? 'bg-primary' : 'bg-primary'}`}
                          style={{ width: `${Math.min(healthScore?.components.sponsorEngagement || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {healthScore?.components.sponsorEngagement.toFixed(0) || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Events Section */}
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

            {/* Events Grid */}
            {loading ? (
              <div className="text-center py-8">
                <Loader size="default" />
                <p className="text-muted-foreground mt-4">Loading events...</p>
              </div>
            ) : recentEvents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentEvents.map((event) => (
                    <OrganizerEventCard key={event.id} event={event} />
                  ))}
                </div>
                {/* Infinite Scroll Loader */}
                {hasMore && (
                  <div ref={loadMoreRef} className="py-8 text-center">
                    {loadingMore && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader size="sm" />
                        <span>Loading more events...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No events yet. Create your first event to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;