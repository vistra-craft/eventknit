import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import OrganizerEventCard from "../../components/OrganizerEventCard";

const PastEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - filtered for completed events only
  const pastEvents = [
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
      id: 10,
      title: "Tech Innovation Summit 2023",
      date: "December 5-7, 2023",
      time: "9:00 AM - 5:00 PM",
      location: "San Francisco, CA",
      venue: "Moscone Center",
      status: "completed",
      attendees: 520,
      capacity: 600,
      revenue: 156000,
      views: 4200,
      conversion: 12.4,
      speakers: 28,
      exhibitors: 22,
      sponsors: 18,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
      description: "Annual technology innovation summit showcasing the latest in tech.",
      category: "Technology"
    },
    {
      id: 11,
      title: "Creative Design Workshop",
      date: "November 15, 2023",
      time: "10:00 AM - 4:00 PM",
      location: "Brooklyn, NY",
      venue: "Brooklyn Creative Center",
      status: "completed",
      attendees: 85,
      capacity: 100,
      revenue: 12750,
      views: 450,
      conversion: 18.9,
      speakers: 6,
      exhibitors: 8,
      sponsors: 3,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      description: "Hands-on workshop for creative professionals and designers.",
      category: "Design"
    },
    {
      id: 12,
      title: "E-commerce Growth Summit",
      date: "October 12-13, 2023",
      time: "9:00 AM - 6:00 PM",
      location: "Las Vegas, NV",
      venue: "Las Vegas Convention Center",
      status: "completed",
      attendees: 380,
      capacity: 400,
      revenue: 57000,
      views: 1800,
      conversion: 21.1,
      speakers: 25,
      exhibitors: 35,
      sponsors: 12,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
      description: "Learn strategies for scaling e-commerce businesses.",
      category: "E-commerce"
    },
    {
      id: 13,
      title: "Data Science Conference",
      date: "September 8-9, 2023",
      time: "8:30 AM - 5:30 PM",
      location: "Denver, CO",
      venue: "Denver Convention Center",
      status: "completed",
      attendees: 290,
      capacity: 350,
      revenue: 43500,
      views: 1200,
      conversion: 24.2,
      speakers: 20,
      exhibitors: 15,
      sponsors: 10,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
      description: "Explore the latest trends in data science and analytics.",
      category: "Data Science"
    },
  ];

  // Filter events based on search
  const filteredEvents = pastEvents.filter(event => {
    return event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate stats
  const totalPast = pastEvents.length;
  const totalAttendees = pastEvents.reduce((sum, e) => sum + e.attendees, 0);
  const totalRevenue = pastEvents.reduce((sum, e) => sum + e.revenue, 0);
  const avgConversion = pastEvents.length > 0 
    ? (pastEvents.reduce((sum, e) => sum + e.conversion, 0) / pastEvents.length).toFixed(1)
    : 0;
  const avgAttendance = pastEvents.length > 0
    ? Math.round(pastEvents.reduce((sum, e) => sum + (e.attendees / e.capacity * 100), 0) / pastEvents.length)
    : 0;

  const stats = [
    {
      title: "Completed Events",
      value: totalPast.toString(),
      icon: Calendar,
      color: "text-accent-electric",
      bgColor: "bg-accent-electric/10",
      borderColor: "border-accent-electric/20",
    },
    {
      title: "Total Attendees",
      value: totalAttendees.toLocaleString(),
      icon: Users,
      color: "text-accent-neon",
      bgColor: "bg-accent-neon/10",
      borderColor: "border-accent-neon/20",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
    },
    {
      title: "Avg Conversion",
      value: `${avgConversion}%`,
      icon: TrendingUp,
      color: "text-accent-coral",
      bgColor: "bg-accent-coral/10",
      borderColor: "border-accent-coral/20",
    },
    {
      title: "Avg Attendance",
      value: `${avgAttendance}%`,
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Past Events</h1>
          <p className="text-muted-foreground">
            Review your completed events and analyze their performance.
          </p>
        </div>
        <div className="flex items-center space-x-3">
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

      {/* Search and Filter */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search past events by title, location, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Past Events ({filteredEvents.length})
          </h2>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <OrganizerEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No past events found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Try adjusting your search criteria."
                : "You don't have any completed events yet."
              }
            </p>
            <Link
              to="/organizer/events/create"
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastEvents;
