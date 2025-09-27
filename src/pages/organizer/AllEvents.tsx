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
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import OrganizerEventCard from "../../components/OrganizerEventCard";

const AllEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - same as dashboard for consistency
  const allEvents = [
    {
      id: "1",
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
      category: "Technology",
      organizer: "Tech Events Inc.",
      price: "$299",
      rating: 4.8,
      fullDescription: "Join us for the most comprehensive technology innovation summit of the year. Featuring keynote speakers, hands-on workshops, and networking opportunities.",
      duration: "3 days",
      ageRestriction: "18+"
    },
    {
      id: "2",
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
      category: "Business",
      organizer: "Business Academy",
      price: "$199",
      rating: 4.6,
      fullDescription: "A comprehensive workshop designed to enhance your leadership capabilities and strategic thinking.",
      duration: "5 hours",
      ageRestriction: "16+"
    },
    {
      id: "3",
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
      category: "Food & Drink",
      organizer: "Culinary Events Co.",
      price: "$89",
      rating: 4.9,
      fullDescription: "An exclusive expo featuring world-class chefs, sommeliers, and culinary experts showcasing the best in food and wine.",
      duration: "9 hours",
      ageRestriction: "21+"
    },
    {
      id: "4",
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
      category: "Marketing",
      organizer: "Marketing Pro",
      price: "$149",
      rating: 4.5,
      fullDescription: "A comprehensive conference covering the latest trends and strategies in digital marketing.",
      duration: "9.5 hours",
      ageRestriction: "18+"
    },
    {
      id: "5",
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
      category: "Startup",
      organizer: "Startup Hub",
      price: "$79",
      rating: 4.7,
      fullDescription: "An exciting competition where innovative startups present their ideas to a panel of investors.",
      duration: "6 hours",
      ageRestriction: "16+"
    },
    {
      id: "6",
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
      category: "Healthcare",
      organizer: "HealthTech Events",
      price: "$399",
      rating: 4.8,
      fullDescription: "A comprehensive summit showcasing the latest innovations and technologies in healthcare.",
      duration: "3 days",
      ageRestriction: "18+"
    },
  ];

  // Filter events based on search and status
  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalEvents = allEvents.length;
  const activeEvents = allEvents.filter(e => e.status === "active").length;
  const upcomingEvents = allEvents.filter(e => e.status === "upcoming").length;
  const totalRevenue = allEvents.reduce((sum, e) => sum + e.revenue, 0);
  const totalAttendees = allEvents.reduce((sum, e) => sum + e.attendees, 0);

  const stats = [
    {
      title: "Total Events",
      value: totalEvents.toString(),
      icon: Calendar,
      color: "text-accent-electric",
      bgColor: "bg-accent-electric/10",
      borderColor: "border-accent-electric/20",
    },
    {
      title: "Active Events",
      value: activeEvents.toString(),
      icon: CheckCircle,
      color: "text-accent-neon",
      bgColor: "bg-accent-neon/10",
      borderColor: "border-accent-neon/20",
    },
    {
      title: "Upcoming Events",
      value: upcomingEvents.toString(),
      icon: Clock,
      color: "text-accent-coral",
      bgColor: "bg-accent-coral/10",
      borderColor: "border-accent-coral/20",
    },
    {
      title: "Total Attendees",
      value: totalAttendees.toLocaleString(),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Total Revenue",
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">All Events</h1>
          <p className="text-muted-foreground">
            Manage and view all your events in one place.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/organizer/events/create"
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center w-full sm:w-auto justify-center"
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
                placeholder="Search events by title, location, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
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
            Events ({filteredEvents.length})
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
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first event."
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

export default AllEvents;
