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
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Pagination } from "../../components/ui/pagination";
import OrganizerEventCard from "../../components/OrganizerEventCard";
import { getOrganizerUpcomingEvents, type OrganizerDashboardEvent } from "../../lib/organizer-api";

const UpcomingEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<OrganizerDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch upcoming events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const filters: {
          search?: string;
          page?: number;
          limit?: number;
        } = {
          page,
          limit,
        };
        
        if (searchTerm) {
          filters.search = searchTerm;
        }

        const response = await getOrganizerUpcomingEvents(filters);

        if (response.success && response.data) {
          setUpcomingEvents(response.data.events as unknown as OrganizerDashboardEvent[]);
          
          // Update pagination info
          if (response.data.totalPages !== undefined) {
            setTotalPages(response.data.totalPages);
          }
          if (response.data.total !== undefined) {
            setTotal(response.data.total);
          }
        } else {
          throw new Error(response.message || 'Failed to fetch upcoming events');
        }
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to load upcoming events. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchTerm, page, limit]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Events are already filtered by API
  const filteredEvents = upcomingEvents;

  // Calculate stats from real data
  const totalUpcoming = upcomingEvents.length;
  const totalCapacity = upcomingEvents.reduce((sum, e) => sum + (typeof e.capacity === 'number' ? e.capacity : 0), 0);
  const totalRegistered = upcomingEvents.reduce((sum, e) => sum + (typeof e.attendees === 'number' ? e.attendees : 0), 0);
  const totalRevenue = upcomingEvents.reduce((sum, e) => sum + (typeof e.revenue === 'number' ? e.revenue : 0), 0);
  const avgConversion = upcomingEvents.length > 0 
    ? (upcomingEvents.reduce((sum, e) => {
        const conv = typeof e.conversion === 'string' ? parseFloat(e.conversion) : (typeof e.conversion === 'number' ? e.conversion : 0);
        return sum + conv;
      }, 0) / upcomingEvents.length).toFixed(1)
    : '0';

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
          <h1 className="text-lg font-semibold text-foreground mb-2">Upcoming Events</h1>
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
          <h2 className="text-lg font-semibold text-foreground">
            Upcoming Events ({total || filteredEvents.length})
          </h2>
          <Select value={limit.toString()} onValueChange={(value) => {
            setLimit(parseInt(value, 10));
            setPage(1);
          }}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading upcoming events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <OrganizerEventCard key={event.id} event={event} />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;
