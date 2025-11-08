import { useState, useEffect } from "react";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Alert, AlertDescription } from "../../components/ui/alert";
import OrganizerEventCard from "../../components/OrganizerEventCard";
import { getOrganizerEvents, type OrganizerDashboardEvent } from "../../lib/organizer-api";
import { transformEventData } from "../../lib/event-utils";
import type { EventData } from "../../types/event";

const AllEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allEvents, setAllEvents] = useState<OrganizerDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const filters: {
          status?: string;
          search?: string;
        } = {};
        
        if (statusFilter !== "all") {
          filters.status = statusFilter.toUpperCase();
        }
        
        if (searchTerm) {
          filters.search = searchTerm;
        }

        const response = await getOrganizerEvents(filters);

        if (response.success && response.data) {
          // Backend already transforms events to OrganizerDashboardEvent format
          setAllEvents(response.data.events as OrganizerDashboardEvent[]);
        } else {
          throw new Error(response.message || 'Failed to fetch events');
        }
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to load events. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchTerm, statusFilter]);

  // Events are already filtered by API
  const filteredEvents = allEvents;

  // Calculate stats from real data
  const totalEvents = allEvents.length;
  const activeEvents = allEvents.filter(e => e.status === "active" || e.status === "approved").length;
  const upcomingEvents = allEvents.filter(e => e.status === "upcoming").length;
  const totalRevenue = allEvents.reduce((sum, e) => sum + (typeof e.revenue === 'number' ? e.revenue : 0), 0);
  const totalAttendees = allEvents.reduce((sum, e) => sum + (typeof e.attendees === 'number' ? e.attendees : 0), 0);

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

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Events Grid */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Events ({filteredEvents.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
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
