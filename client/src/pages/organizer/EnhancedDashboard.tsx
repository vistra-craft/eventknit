import { useState, useEffect } from "react";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  DollarSign,
  Plus,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Mic,
  Building2,
  CheckCircle2,
  Shield,
  X,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OrganizerEventCard from "../../components/OrganizerEventCard";
import { getOrganizerDashboardStats, getOrganizerDashboardEvents, type OrganizerDashboardEvent } from "../../lib/organizer-api";
import { getVerificationStatus, type VerificationStatus } from "../../lib/verification-api";

const EnhancedDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("30d");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationReminder, setVerificationReminder] = useState<string | null>(null);
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);
  const [stats, setStats] = useState([
    {
      title: "Total Events",
      value: "0",
      change: "+0%",
      changeType: "positive" as const,
      icon: Calendar,
      color: "text-accent-electric",
      bgColor: "bg-accent-electric/10",
      borderColor: "border-accent-electric/20",
    },
    {
      title: "Speakers",
      value: "0",
      change: "+0%",
      changeType: "positive" as const,
      icon: Mic,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Exhibitors",
      value: "0",
      change: "+0%",
      changeType: "positive" as const,
      icon: Building2,
      color: "text-accent-coral",
      bgColor: "bg-accent-coral/10",
      borderColor: "border-accent-coral/20",
    },
    {
      title: "Active Attendees",
      value: "0",
      change: "+0%",
      changeType: "positive" as const,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Total Revenue",
      value: "$0",
      change: "+0%",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
  ]);
  const [recentEvents, setRecentEvents] = useState<OrganizerDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);

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

  // Fetch verification status
  const fetchVerificationStatus = async () => {
    try {
      setLoadingVerification(true);
      const response = await getVerificationStatus();
      if (response.success && response.data) {
        setVerificationStatus(response.data);
        // Check if banner was dismissed for this session
        const dismissed = sessionStorage.getItem('verificationBannerDismissed');
        if (dismissed && !response.data.identityVerified) {
          setShowVerificationBanner(false);
        } else {
          setShowVerificationBanner(true);
          // Clear dismissal if verification is complete
          if (response.data.identityVerified) {
            sessionStorage.removeItem('verificationBannerDismissed');
          }
        }
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setLoadingVerification(false);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();

    // Listen for verification status updates
    const handleVerificationUpdate = () => {
      fetchVerificationStatus();
    };
    window.addEventListener('verificationStatusUpdated', handleVerificationUpdate);

    return () => {
      window.removeEventListener('verificationStatusUpdated', handleVerificationUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, eventsResponse] = await Promise.all([
          getOrganizerDashboardStats(),
          getOrganizerDashboardEvents({ page: 1, limit: 12 }),
        ]);

        if (statsResponse.success && statsResponse.data.stats) {
          const dashboardStats = statsResponse.data.stats;
          setStats([
            {
              title: "Total Events",
              value: dashboardStats.totalEvents.toString(),
              change: "+0%", // TODO: Calculate change from previous period
              changeType: "positive",
              icon: Calendar,
              color: "text-accent-electric",
              bgColor: "bg-accent-electric/10",
              borderColor: "border-accent-electric/20",
            },
            {
              title: "Speakers",
              value: dashboardStats.totalSpeakers.toString(),
              change: "+0%",
              changeType: "positive",
              icon: Mic,
              color: "text-accent-neon",
              bgColor: "bg-accent-neon/10",
              borderColor: "border-accent-neon/20",
            },
            {
              title: "Exhibitors",
              value: dashboardStats.totalExhibitors.toString(),
              change: "+0%",
              changeType: "positive",
              icon: Building2,
              color: "text-accent-coral",
              bgColor: "bg-accent-coral/10",
              borderColor: "border-accent-coral/20",
            },
            {
              title: "Active Attendees",
              value: dashboardStats.totalAttendees.toLocaleString(),
              change: "+0%",
              changeType: "positive",
              icon: Users,
              color: "text-primary",
              bgColor: "bg-primary/10",
              borderColor: "border-primary/20",
            },
            {
              title: "Total Revenue",
              value: `$${dashboardStats.totalRevenue.toLocaleString()}`,
              change: "+0%",
              changeType: "positive",
              icon: DollarSign,
              color: "text-primary",
              bgColor: "bg-primary/10",
              borderColor: "border-primary/20",
            },
          ]);
        }

        if (eventsResponse.success && eventsResponse.data) {
          setRecentEvents(eventsResponse.data.events);
          setHasMore(eventsResponse.data.hasMore || false);
          setPage(1);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
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
          <Alert className="mb-6 border-green-500/20 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Reminder */}
        {showVerificationReminder && verificationReminder && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-blue-900 dark:text-blue-100 flex-1">
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
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                  Verify Identity
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVerificationReminder(false)}
                  className="text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Notification Banner */}
        {!loadingVerification && verificationStatus && !verificationStatus.identityVerified && showVerificationBanner && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 text-lg">
                    Complete Your Verification
                  </h3>
                  <p className="text-amber-800 dark:text-amber-200 mb-4">
                    Verify your identity to create paid events and receive payouts from ticket sales.
                  </p>
                  
                  {/* Verification Steps */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      {verificationStatus.identityVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${verificationStatus.identityVerified ? 'text-green-700 dark:text-green-300' : 'text-amber-900 dark:text-amber-100'}`}>
                            Step 1: Identity Verification
                          </span>
                          {verificationStatus.identityVerified && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {verificationStatus.identityVerified 
                            ? "Your identity has been verified. You can now create paid events."
                            : "Provide your personal information and upload a government-issued ID (passport, driver's license, or national ID)."}
                        </p>
                      </div>
                    </div>

                    {verificationStatus.identityVerified && (
                      <div className="flex items-start gap-3">
                        {verificationStatus.verificationLevel === 3 && verificationStatus.kycStatus === 'APPROVED' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium ${verificationStatus.verificationLevel === 3 && verificationStatus.kycStatus === 'APPROVED' ? 'text-green-700 dark:text-green-300' : 'text-amber-900 dark:text-amber-100'}`}>
                              Step 2: Business Verification (Optional)
                            </span>
                            {verificationStatus.verificationLevel === 3 && verificationStatus.kycStatus === 'APPROVED' && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700">
                                Completed
                              </Badge>
                            )}
                            {verificationStatus.kycStatus === 'PENDING' && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700">
                                Under Review
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            {verificationStatus.verificationLevel === 3 && verificationStatus.kycStatus === 'APPROVED'
                              ? "Your business verification is complete. You can receive unlimited payouts."
                              : verificationStatus.kycStatus === 'PENDING'
                              ? "Your business verification documents are under review."
                              : verificationStatus.payoutLimit
                              ? `Optional: Complete business verification to remove the $${verificationStatus.payoutLimit.toLocaleString()}/month payout limit. You can still receive payouts with just identity verification.`
                              : "Optional: Complete business verification for unlimited payouts and higher event limits."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {!verificationStatus.identityVerified && (
                    <div className="flex items-center gap-3 pt-2 border-t border-amber-200 dark:border-amber-800">
                      <Button
                        onClick={() => {
                          navigate('/organizer/verification', { 
                            state: { redirectAfterVerification: '/organizer/dashboard' } 
                          });
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Start Verification
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Store dismissal in sessionStorage to hide for this session
                          sessionStorage.setItem('verificationBannerDismissed', 'true');
                          setShowVerificationBanner(false);
                        }}
                        className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Partial Verification Notice (Identity verified but not business) */}
        {!loadingVerification && verificationStatus && verificationStatus.identityVerified && 
         verificationStatus.verificationLevel < 3 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Upgrade to Full Verification
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 mb-3">
                    {verificationStatus.payoutLimit 
                      ? `You currently have a $${verificationStatus.payoutLimit.toLocaleString()}/month payout limit. Optional: Complete business verification for unlimited payouts. You can still receive payouts with just identity verification.`
                      : "Optional: Complete business verification to unlock unlimited payouts and higher event limits."}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate('/organizer/verification', { 
                          state: { redirectAfterVerification: '/organizer/dashboard' } 
                        });
                      }}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                      Complete Business Verification
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Dashboard Overview</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back! Here's what's happening with your events.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-primary rounded-lg text-sm focus:ring-2 focus:ring-accent-coral focus:border-accent-coral bg-white text-foreground hover:bg-accent-coral hover:text-white transition-colors"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Link
              to="/organizer/events/create"
              className="bg-accent-coral hover:bg-accent-coral/90 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:bg-primary/5 transition-all ${stat.borderColor} p-4`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-lg font-semibold text-foreground mb-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center">
                    {stat.changeType === "positive" ? (
                      <ArrowUpRight className="h-3 w-3 text-primary mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-accent-coral mr-1" />
                    )}
                    <span
                      className={`text-xs font-medium ${stat.changeType === "positive" ? "text-primary" : "text-accent-coral"}`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:bg-primary/5 transition-all p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/organizer/events/create"
                className="flex items-center p-4 border border-primary rounded-lg hover:border-accent-coral hover:bg-accent-coral hover:text-white transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Create Event</p>
                  <p className="text-sm text-muted-foreground">Start a new event</p>
                </div>
              </Link>

              <Link
                to="/organizer/analytics"
                className="flex items-center p-4 border border-primary rounded-lg hover:border-accent-coral hover:bg-accent-coral hover:text-white transition-colors duration-200"
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
                className="flex items-center p-4 border border-primary rounded-lg hover:border-accent-coral hover:bg-accent-coral hover:text-white transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Manage Attendees</p>
                  <p className="text-sm text-muted-foreground">View and manage</p>
                </div>
              </Link>

              <Link
                to="/organizer/tickets/scanner"
                className="flex items-center p-4 border border-primary rounded-lg hover:border-accent-coral hover:bg-accent-coral hover:text-white transition-colors duration-200"
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
          </div>

          {/* Insights Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Insights */}
            <div className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:bg-primary/5 transition-all">
              <div className="p-6 border-b border-border">
                <h3 className="text-base font-semibold text-foreground">
                  Performance Insights
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Best Performing Event</p>
                    <p className="text-xs text-muted-foreground">Tech Innovation Summit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">21.4%</p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Total Revenue Growth</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">+24%</p>
                    <p className="text-xs text-muted-foreground">vs last month</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Average Attendance</p>
                    <p className="text-xs text-muted-foreground">All events</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">87%</p>
                    <p className="text-xs text-muted-foreground">capacity</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:bg-primary/5 transition-all">
              <div className="p-6 border-b border-border">
                <h3 className="text-base font-semibold text-foreground">
                  Upcoming Deadlines
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Speaker Confirmations</p>
                    <p className="text-xs text-muted-foreground">Business Workshop</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-coral">3 days</p>
                    <p className="text-xs text-muted-foreground">left</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Abstract Submissions</p>
                    <p className="text-xs text-muted-foreground">Tech Summit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-coral">1 week</p>
                    <p className="text-xs text-muted-foreground">left</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Early Bird Pricing</p>
                    <p className="text-xs text-muted-foreground">Startup Competition</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">2 weeks</p>
                    <p className="text-xs text-muted-foreground">left</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Health Score */}
            <div className="border-0 bg-card-surface rounded-2xl shadow-sm hover:shadow-md hover:bg-primary/5 transition-all">
              <div className="p-6 border-b border-border">
                <h3 className="text-base font-semibold text-foreground">
                  Event Health Score
                </h3>
              </div>
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mb-2">
                    <span className="text-xl font-bold text-white">92</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Health</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Registration Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-4/5 h-full bg-primary rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Speaker Confirmation</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-3/4 h-full bg-primary rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sponsor Engagement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-full h-full bg-accent-coral rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* My Events Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">My Events</h2>
              <Link
                to="/organizer/events"
                className="text-primary hover:text-accent-coral font-medium text-sm flex items-center transition-colors"
              >
                View all events
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading events...</p>
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
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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