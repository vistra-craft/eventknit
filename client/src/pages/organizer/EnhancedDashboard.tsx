import { useState, useEffect } from "react";
import React from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import OrganizerEventCard from "../../components/OrganizerEventCard";
import { getOrganizerDashboardStats, getOrganizerDashboardEvents, type OrganizerDashboardEvent } from "../../lib/organizer-api";

const EnhancedDashboard = () => {
  const [timeRange, setTimeRange] = useState("30d");
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
      color: "text-accent-neon",
      bgColor: "bg-accent-neon/10",
      borderColor: "border-accent-neon/20",
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
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
    },
  ]);
  const [recentEvents, setRecentEvents] = useState<OrganizerDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

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
              color: "text-green-600",
              bgColor: "bg-green-100",
              borderColor: "border-green-200",
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back! Here's what's happening with your events.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Link
              to="/organizer/events/create"
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
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
              className={`bg-card rounded-xl border ${stat.borderColor} p-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-foreground mb-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center">
                    {stat.changeType === "positive" ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span
                      className={`text-xs font-medium ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}
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
          
          {/* My Events Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">My Events</h2>
              <Link
                to="/organizer/events"
                className="text-primary hover:text-primary/80 font-medium text-sm flex items-center"
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

          {/* Insights Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Insights */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
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
                    <p className="text-sm font-bold text-green-600">21.4%</p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Total Revenue Growth</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">+24%</p>
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
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
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
                    <p className="text-sm font-bold text-yellow-600">3 days</p>
                    <p className="text-xs text-muted-foreground">left</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Abstract Submissions</p>
                    <p className="text-xs text-muted-foreground">Tech Summit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">1 week</p>
                    <p className="text-xs text-muted-foreground">left</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Early Bird Pricing</p>
                    <p className="text-xs text-muted-foreground">Startup Competition</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">2 weeks</p>
                    <p className="text-xs text-muted-foreground">left</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Health Score */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Event Health Score
                </h3>
              </div>
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold text-white">92</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Health</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Registration Rate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-4/5 h-full bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Speaker Confirmation</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-3/4 h-full bg-blue-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sponsor Engagement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className="w-full h-full bg-yellow-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/organizer/events/create"
                className="flex items-center p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors duration-200"
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
                className="flex items-center p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors duration-200"
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
                className="flex items-center p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors duration-200"
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
                className="flex items-center p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors duration-200"
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
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;