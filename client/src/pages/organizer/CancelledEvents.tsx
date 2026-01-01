import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  DollarSign,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Pagination } from "../../components/ui/pagination";
import OrganizerEventCard from "../../components/OrganizerEventCard";
import { getOrganizerEvents, type OrganizerDashboardEvent } from "../../lib/organizer-api";

const CancelledEvents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cancelledEvents, setCancelledEvents] = useState<OrganizerDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch cancelled events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const filters: {
          status?: string;
          search?: string;
          page?: number;
          limit?: number;
        } = {
          status: "CANCELLED",
          page,
          limit,
        };
        
        if (searchTerm) {
          filters.search = searchTerm;
        }

        const response = await getOrganizerEvents(filters);

        if (response.success && response.data) {
          setCancelledEvents(response.data.events as unknown as OrganizerDashboardEvent[]);
          
          // Update pagination info
          if (response.data.totalPages !== undefined) {
            setTotalPages(response.data.totalPages);
          }
          if (response.data.total !== undefined) {
            setTotal(response.data.total);
          }
        } else {
          throw new Error(response.message || 'Failed to fetch cancelled events');
        }
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : 'Failed to load cancelled events. Please try again.';
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
  const filteredEvents = cancelledEvents;

  // Calculate stats from real data
  const totalCancelled = cancelledEvents.length;
  const totalAttendees = cancelledEvents.reduce((sum, e) => sum + (typeof e.attendees === 'number' ? e.attendees : 0), 0);
  const totalRevenue = cancelledEvents.reduce((sum, e) => sum + (typeof e.revenue === 'number' ? e.revenue : 0), 0);

  const stats = [
    {
      title: "Cancelled Events",
      value: totalCancelled.toString(),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-200",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Cancelled Events</h1>
          <p className="text-sm text-muted-foreground">
            View events that have been cancelled by you or the admin
          </p>
        </div>
        <Link to="/organizer/events/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Event
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-6 border-2 rounded-lg ${stat.borderColor} ${stat.bgColor} transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search cancelled events by title, location, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">
            Cancelled Events ({total || filteredEvents.length})
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={limit.toString()} onValueChange={(value) => {
              setLimit(parseInt(value, 10));
              setPage(1);
            }}>
              <SelectTrigger className="w-20">
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
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground ml-3">Loading cancelled events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No cancelled events found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "You don't have any cancelled events."}
            </p>
            <Link to="/organizer/events/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Event
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <OrganizerEventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CancelledEvents;


