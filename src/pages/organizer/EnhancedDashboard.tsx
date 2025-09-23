import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const EnhancedDashboard = () => {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data - in a real app, this would come from your API
  const stats = [
    {
      title: "Total Events",
      value: "24",
      change: "+12%",
      changeType: "positive",
      icon: Calendar,
      color: "text-accent-electric",
      bgColor: "bg-accent-electric/10",
      borderColor: "border-accent-electric/20",
    },
    {
      title: "Active Attendees",
      value: "4,247",
      change: "+18%",
      changeType: "positive",
      icon: Users,
      color: "text-accent-neon",
      bgColor: "bg-accent-neon/10",
      borderColor: "border-accent-neon/20",
    },
    {
      title: "Total Revenue",
      value: "$127,450",
      change: "+24%",
      changeType: "positive",
      icon: DollarSign,
      color: "text-accent-coral",
      bgColor: "bg-accent-coral/10",
      borderColor: "border-accent-coral/20",
    },
    {
      title: "Conversion Rate",
      value: "15.8%",
      change: "+3.2%",
      changeType: "positive",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
  ];

  const recentEvents = [
    {
      id: 1,
      title: "Tech Innovation Summit 2024",
      date: "2024-03-15",
      time: "9:00 AM - 5:00 PM",
      location: "San Francisco, CA",
      status: "active",
      attendees: 485,
      capacity: 500,
      revenue: 145200,
      views: 3250,
      conversion: 14.9,
    },
    {
      id: 2,
      title: "Business Leadership Workshop",
      date: "2024-04-02",
      time: "10:00 AM - 3:00 PM",
      location: "New York, NY",
      status: "upcoming",
      attendees: 78,
      capacity: 100,
      revenue: 15600,
      views: 890,
      conversion: 8.8,
    },
    {
      id: 3,
      title: "Food & Wine Expo",
      date: "2024-02-10",
      time: "11:00 AM - 8:00 PM",
      location: "Los Angeles, CA",
      status: "completed",
      attendees: 320,
      capacity: 350,
      revenue: 25600,
      views: 1890,
      conversion: 16.9,
    },
    {
      id: 4,
      title: "Digital Marketing Conference",
      date: "2024-01-20",
      time: "8:30 AM - 6:00 PM",
      location: "Chicago, IL",
      status: "completed",
      attendees: 450,
      capacity: 500,
      revenue: 67500,
      views: 2100,
      conversion: 21.4,
    },
    {
      id: 5,
      title: "Startup Pitch Competition",
      date: "2024-05-15",
      time: "2:00 PM - 8:00 PM",
      location: "Austin, TX",
      status: "upcoming",
      attendees: 25,
      capacity: 200,
      revenue: 3750,
      views: 450,
      conversion: 5.6,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "registration",
      message: "Sarah Johnson registered for Tech Innovation Summit 2024",
      time: "2 minutes ago",
      icon: Users,
      color: "text-accent-neon",
    },
    {
      id: 2,
      type: "payment",
      message: "Payment of $299 received for Business Leadership Workshop",
      time: "5 minutes ago",
      icon: DollarSign,
      color: "text-accent-electric",
    },
    {
      id: 3,
      type: "registration",
      message: "Michael Chen registered for Startup Pitch Competition",
      time: "12 minutes ago",
      icon: Users,
      color: "text-accent-neon",
    },
    {
      id: 4,
      type: "view",
      message: "Tech Innovation Summit 2024 page viewed 47 times today",
      time: "18 minutes ago",
      icon: Eye,
      color: "text-accent-coral",
    },
    {
      id: 5,
      type: "payment",
      message: "Payment of $150 received for Food & Wine Expo",
      time: "25 minutes ago",
      icon: DollarSign,
      color: "text-accent-electric",
    },
    {
      id: 6,
      type: "registration",
      message: "Emma Wilson registered for Digital Marketing Conference",
      time: "1 hour ago",
      icon: Users,
      color: "text-accent-neon",
    },
    {
      id: 7,
      type: "completion",
      message: "Food & Wine Expo completed successfully with 320 attendees",
      time: "2 hours ago",
      icon: CheckCircle,
      color: "text-accent-neon",
    },
    {
      id: 8,
      type: "view",
      message: "Business Leadership Workshop page viewed 23 times today",
      time: "3 hours ago",
      icon: Eye,
      color: "text-accent-coral",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent-neon/10 text-accent-neon border-accent-neon/20";
      case "upcoming":
        return "bg-accent-electric/10 text-accent-electric border-accent-electric/20";
      case "completed":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "upcoming":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your events.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent-neon focus:border-transparent bg-card text-foreground"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Link
            to="/events/create"
            className="bg-accent-neon hover:bg-accent-neon/80 text-primary px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-card rounded-xl border ${stat.borderColor} p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground mb-2">
                  {stat.value}
                </p>
                <div className="flex items-center">
                  {stat.changeType === "positive" ? (
                    <ArrowUpRight className="h-4 w-4 text-accent-neon mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive"
                        ? "text-accent-neon"
                        : "text-destructive"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">
                    vs last period
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-card border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Events
                </h3>
                <Link
                  to="/organizer/events"
                  className="text-accent-neon hover:text-accent-neon/80 font-medium text-sm flex items-center"
                >
                  View all events
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-border rounded-lg p-4 hover:shadow-card transition-shadow duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">
                          {event.title}
                        </h4>
                        <div className="flex items-center text-sm text-muted-foreground space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {event.date}
                          </span>
                          <span>{event.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            event.status
                          )} flex items-center`}
                        >
                          {getStatusIcon(event.status)}
                          <span className="ml-1 capitalize">
                            {event.status}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Attendees</p>
                        <p className="font-medium text-foreground">
                          {event.attendees}/{event.capacity}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium text-foreground">
                          ${event.revenue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Views</p>
                        <p className="font-medium text-foreground">
                          {event.views}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversion</p>
                        <p className="font-medium text-foreground">
                          {event.conversion}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-card border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center`}
                    >
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  to="/organizer/activity"
                  className="text-sm text-accent-neon hover:text-accent-neon/80 font-medium"
                >
                  View all activity
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl shadow-card border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/events/create"
            className="flex items-center p-4 border border-border rounded-lg hover:border-accent-neon hover:bg-accent-neon/5 transition-colors duration-200"
          >
            <div className="w-10 h-10 bg-accent-neon/10 rounded-lg flex items-center justify-center mr-3">
              <Plus className="h-5 w-5 text-accent-neon" />
            </div>
            <div>
              <p className="font-medium text-foreground">Create Event</p>
              <p className="text-sm text-muted-foreground">Start a new event</p>
            </div>
          </Link>

          <Link
            to="/organizer/analytics"
            className="flex items-center p-4 border border-border rounded-lg hover:border-accent-electric hover:bg-accent-electric/5 transition-colors duration-200"
          >
            <div className="w-10 h-10 bg-accent-electric/10 rounded-lg flex items-center justify-center mr-3">
              <BarChart3 className="h-5 w-5 text-accent-electric" />
            </div>
            <div>
              <p className="font-medium text-foreground">View Analytics</p>
              <p className="text-sm text-muted-foreground">Performance insights</p>
            </div>
          </Link>

          <Link
            to="/organizer/attendees"
            className="flex items-center p-4 border border-border rounded-lg hover:border-accent-coral hover:bg-accent-coral/5 transition-colors duration-200"
          >
            <div className="w-10 h-10 bg-accent-coral/10 rounded-lg flex items-center justify-center mr-3">
              <Users className="h-5 w-5 text-accent-coral" />
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
  );
};

export default EnhancedDashboard;

