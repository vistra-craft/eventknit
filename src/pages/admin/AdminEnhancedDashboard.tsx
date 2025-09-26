import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  CheckCircle,
  Shield,
  AlertTriangle,
  Database,
  Activity,
  UserCheck,
  Clock,
} from "lucide-react";

const AdminEnhancedDashboard = () => {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data - in a real app, this would come from your API
  const stats = [
    {
      title: "Total Events",
      value: "1,247",
      change: "+18%",
      changeType: "positive",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
    },
    {
      title: "Active Staff",
      value: "12,456",
      change: "+24%",
      changeType: "positive",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
    },
    {
      title: "Organizers",
      value: "1,089",
      change: "+15%",
      changeType: "positive",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
    },
    {
      title: "Platform Revenue",
      value: "$2,847,450",
      change: "+32%",
      changeType: "positive",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
    },
    {
      title: "System Health",
      value: "99.9%",
      change: "+0.1%",
      changeType: "positive",
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
    },
  ];

  const recentEvents = [
    {
      id: "1",
      title: "Tech Conference 2024",
      organizer: "Tech Events Co.",
      date: "2024-03-15",
      attendees: 1250,
      status: "active",
      revenue: "$45,000",
      category: "Technology",
    },
    {
      id: "2",
      title: "Business Leadership Workshop",
      organizer: "Business Academy",
      date: "2024-03-20",
      attendees: 450,
      status: "pending",
      revenue: "$12,500",
      category: "Business",
    },
    {
      id: "3",
      title: "Music Festival 2024",
      organizer: "Music Events Ltd",
      date: "2024-04-01",
      attendees: 5000,
      status: "active",
      revenue: "$125,000",
      category: "Entertainment",
    },
    {
      id: "4",
      title: "Health & Wellness Expo",
      organizer: "Wellness Corp",
      date: "2024-03-25",
      attendees: 800,
      status: "approved",
      revenue: "$28,000",
      category: "Health",
    },
  ];

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      message: "High server load detected on database cluster",
      time: "5 minutes ago",
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
    {
      id: 2,
      type: "info",
      message: "Scheduled maintenance window: March 20, 2:00 AM - 4:00 AM",
      time: "2 hours ago",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "success",
      message: "Backup completed successfully",
      time: "4 hours ago",
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "staff_registration",
      message: "New staff member registered: John Smith",
      time: "10 minutes ago",
      icon: UserCheck,
      color: "text-primary",
    },
    {
      id: 2,
      type: "event_approval",
      message: "Event 'Business Workshop' approved for publication",
      time: "25 minutes ago",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      id: 3,
      type: "payment",
      message: "Payment processed: $2,500 from Music Events Ltd",
      time: "1 hour ago",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      id: 4,
      type: "system",
      message: "Database optimization completed",
      time: "2 hours ago",
      icon: Database,
      color: "text-blue-600",
    },
    {
      id: 5,
      type: "moderation",
      message: "Content flagged for review: Event 'Party Night'",
      time: "3 hours ago",
      icon: Shield,
      color: "text-yellow-600",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center">
              <Shield className="h-8 w-8 mr-3 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Platform overview and system management
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
              to="/admin/events/create"
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center space-x-1">
                  {stat.changeType === "positive" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Events */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Recent Events</h2>
                <Link
                  to="/admin/events"
                  className="text-primary hover:text-primary/80 text-sm font-medium flex items-center"
                >
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            event.status
                          )}`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {event.organizer}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {event.date}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {event.attendees.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{event.revenue}</p>
                      <p className="text-sm text-muted-foreground">{event.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Alerts & Activity */}
          <div className="space-y-6">
            {/* System Alerts */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">System Alerts</h2>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                  >
                    <alert.icon className={`h-4 w-4 mt-0.5 ${alert.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <activity.icon className={`h-4 w-4 mt-0.5 ${activity.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEnhancedDashboard;

