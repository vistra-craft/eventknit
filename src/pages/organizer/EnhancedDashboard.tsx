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
  Mic,
  Building2,
  Star,
  MapPin,
  ArrowLeft,
  Settings,
  MessageCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const EnhancedDashboard = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedEvent, setSelectedEvent] = useState(null);

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
      title: "Speakers",
      value: "156",
      change: "+8%",
      changeType: "positive",
      icon: Mic,
      color: "text-accent-neon",
      bgColor: "bg-accent-neon/10",
      borderColor: "border-accent-neon/20",
    },
    {
      title: "Exhibitors",
      value: "89",
      change: "+15%",
      changeType: "positive",
      icon: Building2,
      color: "text-accent-coral",
      bgColor: "bg-accent-coral/10",
      borderColor: "border-accent-coral/20",
    },
    {
      title: "Active Attendees",
      value: "4,247",
      change: "+18%",
      changeType: "positive",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Total Revenue",
      value: "$127,450",
      change: "+24%",
      changeType: "positive",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
    },
  ];

  const recentEvents = [
    {
      id: 1,
      title: "Tech Innovation Summit 2024",
      date: "March 15-17, 2024",
      time: "9:00 AM - 5:00 PM",
      location: "San Francisco, CA",
      venue: "Moscone Center",
      status: "active",
      attendees: 485,
      capacity: 500,
      revenue: 145200,
      views: 3250,
      conversion: 14.9,
      speakers: 24,
      exhibitors: 18,
      sponsors: 12,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
      description: "Explore the latest in technology innovation and digital transformation.",
      category: "Technology"
    },
    {
      id: 2,
      title: "Business Leadership Workshop",
      date: "April 2, 2024",
      time: "10:00 AM - 3:00 PM",
      location: "New York, NY",
      venue: "Manhattan Center",
      status: "upcoming",
      attendees: 78,
      capacity: 100,
      revenue: 15600,
      views: 890,
      conversion: 8.8,
      speakers: 8,
      exhibitors: 5,
      sponsors: 3,
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
      description: "Master leadership skills for the modern business landscape.",
      category: "Business"
    },
    {
      id: 3,
      title: "Food & Wine Expo",
      date: "February 10, 2024",
      time: "11:00 AM - 8:00 PM",
      location: "Los Angeles, CA",
      venue: "Convention Center",
      status: "completed",
      attendees: 320,
      capacity: 350,
      revenue: 25600,
      views: 1890,
      conversion: 16.9,
      speakers: 15,
      exhibitors: 45,
      sponsors: 8,
      image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop",
      description: "Discover the finest culinary experiences and wine tastings.",
      category: "Food & Drink"
    },
    {
      id: 4,
      title: "Digital Marketing Conference",
      date: "January 20, 2024",
      time: "8:30 AM - 6:00 PM",
      location: "Chicago, IL",
      venue: "McCormick Place",
      status: "completed",
      attendees: 450,
      capacity: 500,
      revenue: 67500,
      views: 2100,
      conversion: 21.4,
      speakers: 32,
      exhibitors: 28,
      sponsors: 15,
      image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop",
      description: "Learn cutting-edge digital marketing strategies and tools.",
      category: "Marketing"
    },
    {
      id: 5,
      title: "Startup Pitch Competition",
      date: "May 15, 2024",
      time: "2:00 PM - 8:00 PM",
      location: "Austin, TX",
      venue: "Austin Convention Center",
      status: "upcoming",
      attendees: 25,
      capacity: 200,
      revenue: 3750,
      views: 450,
      conversion: 5.6,
      speakers: 12,
      exhibitors: 8,
      sponsors: 5,
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop",
      description: "Watch innovative startups pitch their ideas to investors.",
      category: "Startup"
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
      eventId: 1,
    },
    {
      id: 2,
      type: "payment",
      message: "Payment of $299 received for Business Leadership Workshop",
      time: "5 minutes ago",
      icon: DollarSign,
      color: "text-accent-electric",
      eventId: 2,
    },
    {
      id: 3,
      type: "speaker",
      message: "New speaker Dr. Maria Rodriguez added to Digital Marketing Conference",
      time: "12 minutes ago",
      icon: Mic,
      color: "text-accent-coral",
      eventId: 4,
    },
    {
      id: 4,
      type: "exhibitor",
      message: "Exhibitor booth confirmed for Food & Wine Expo - Wine Masters Inc.",
      time: "18 minutes ago",
      icon: Building2,
      color: "text-primary",
      eventId: 3,
    },
    {
      id: 5,
      type: "registration",
      message: "Michael Chen registered for Startup Pitch Competition",
      time: "25 minutes ago",
      icon: Users,
      color: "text-accent-neon",
      eventId: 5,
    },
    {
      id: 6,
      type: "sponsor",
      message: "Gold sponsor partnership confirmed for Tech Innovation Summit",
      time: "1 hour ago",
      icon: Star,
      color: "text-yellow-600",
      eventId: 1,
    },
    {
      id: 7,
      type: "payment",
      message: "Payment of $150 received for Food & Wine Expo",
      time: "1 hour ago",
      icon: DollarSign,
      color: "text-accent-electric",
      eventId: 3,
    },
    {
      id: 8,
      type: "completion",
      message: "Food & Wine Expo completed successfully with 320 attendees",
      time: "2 hours ago",
      icon: CheckCircle,
      color: "text-green-600",
      eventId: 3,
    },
    {
      id: 9,
      type: "view",
      message: "Business Leadership Workshop page viewed 23 times today",
      time: "3 hours ago",
      icon: Eye,
      color: "text-accent-coral",
      eventId: 2,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Main Content - Dashboard Overview */}
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
                <p className="text-muted-foreground">
                  Welcome back! Here's what's happening with your events.
                </p>
              </div>
              <div className="flex items-center space-x-3">
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
                  to="/events/create"
                  className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
                          className={`text-xs font-medium ${
                            stat.changeType === "positive"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
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

            {/* My Events Section */}
            <div className="mb-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={event.image}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className={`${getStatusColor(event.status)} border-0`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(event.status)}
                            <span className="capitalize">{event.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-white/90 text-gray-800">
                          {event.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{event.attendees}/{event.capacity} attendees</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      
                      {/* Event Metrics */}
                      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Speakers</p>
                          <p className="font-semibold text-foreground">{event.speakers}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Exhibitors</p>
                          <p className="font-semibold text-foreground">{event.exhibitors}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="font-semibold text-foreground">${event.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {event.conversion}% conversion
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/organizer/event/${event.id}`;
                          }}
                        >
                          Manage Event
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-foreground">
                    Recent Activity
                  </h3>
                  <Link
                    to="/organizer/activity"
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    View all activity
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.slice(0, 6).map((activity) => (
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;



