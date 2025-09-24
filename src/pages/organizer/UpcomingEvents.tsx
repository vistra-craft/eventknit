import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import EventCard from "../../components/EventCard";

const UpcomingEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - filtered for upcoming events only
  const upcomingEvents = [
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
    {
      id: 6,
      title: "Healthcare Innovation Summit",
      date: "June 20-22, 2024",
      time: "9:00 AM - 6:00 PM",
      location: "Boston, MA",
      venue: "Boston Convention Center",
      status: "upcoming",
      attendees: 0,
      capacity: 300,
      revenue: 0,
      views: 120,
      conversion: 0,
      speakers: 0,
      exhibitors: 0,
      sponsors: 0,
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop",
      description: "Explore the latest innovations in healthcare technology and patient care.",
      category: "Healthcare"
    },
    {
      id: 7,
      title: "AI & Machine Learning Conference",
      date: "July 10-12, 2024",
      time: "9:00 AM - 5:00 PM",
      location: "Seattle, WA",
      venue: "Washington State Convention Center",
      status: "upcoming",
      attendees: 45,
      capacity: 400,
      revenue: 13500,
      views: 680,
      conversion: 6.6,
      speakers: 18,
      exhibitors: 12,
      sponsors: 8,
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
      description: "Discover the latest advances in artificial intelligence and machine learning.",
      category: "Technology"
    },
    {
      id: 8,
      title: "Sustainable Business Summit",
      date: "August 5, 2024",
      time: "8:30 AM - 4:30 PM",
      location: "Portland, OR",
      venue: "Oregon Convention Center",
      status: "upcoming",
      attendees: 12,
      capacity: 150,
      revenue: 2400,
      views: 180,
      conversion: 6.7,
      speakers: 10,
      exhibitors: 6,
      sponsors: 4,
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop",
      description: "Learn about sustainable business practices and environmental responsibility.",
      category: "Sustainability"
    },
    {
      id: 9,
      title: "FinTech Innovation Forum",
      date: "September 15-16, 2024",
      time: "9:00 AM - 6:00 PM",
      location: "Miami, FL",
      venue: "Miami Beach Convention Center",
      status: "upcoming",
      attendees: 8,
      capacity: 250,
      revenue: 4000,
      views: 95,
      conversion: 8.4,
      speakers: 15,
      exhibitors: 10,
      sponsors: 6,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
      description: "Explore the future of financial technology and digital banking.",
      category: "Finance"
    },
  ];

  // Filter events based on search
  const filteredEvents = upcomingEvents.filter(event => {
    return event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate stats
  const totalUpcoming = upcomingEvents.length;
  const totalCapacity = upcomingEvents.reduce((sum, e) => sum + e.capacity, 0);
  const totalRegistered = upcomingEvents.reduce((sum, e) => sum + e.attendees, 0);
  const totalRevenue = upcomingEvents.reduce((sum, e) => sum + e.revenue, 0);
  const avgConversion = upcomingEvents.length > 0 
    ? (upcomingEvents.reduce((sum, e) => sum + e.conversion, 0) / upcomingEvents.length).toFixed(1)
    : 0;

  const stats = [
    {
      title: "Upcoming Events",
      value: totalUpcoming.toString(),
      icon: Calendar,
      color: "text-accent-electric",
      bgColor: "bg-accent-electric/10",
      borderColor: "border-accent-electric/20",
    },
    {
      title: "Total Capacity",
      value: totalCapacity.toLocaleString(),
      icon: Users,
      color: "text-accent-neon",
      bgColor: "bg-accent-neon/10",
      borderColor: "border-accent-neon/20",
    },
    {
      title: "Registered",
      value: totalRegistered.toLocaleString(),
      icon: CheckCircle,
      color: "text-accent-coral",
      bgColor: "bg-accent-coral/10",
      borderColor: "border-accent-coral/20",
    },
    {
      title: "Avg Conversion",
      value: `${avgConversion}%`,
      icon: ArrowUpRight,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Upcoming Events</h1>
          <p className="text-muted-foreground">
            Manage your upcoming events and track their progress.
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
                placeholder="Search upcoming events by title, location, or category..."
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
            Upcoming Events ({filteredEvents.length})
          </h2>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming events found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Try adjusting your search criteria."
                : "You don't have any upcoming events yet."
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

export default UpcomingEvents;
