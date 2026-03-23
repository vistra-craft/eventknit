import { Link } from "react-router-dom";
import {
  Search,
  Calendar,
  Clock,
  XCircle,
  Plus,
  Users,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Loader } from "@/components/ui/loader";
import OrganizerEventCard from '@/components/organizer-ui/OrganizerEventCard';
import type { OrganizerDashboardEvent } from "@/lib/organizer-api";
import type { EventView } from "@/hooks/useOrganizerEvents";

interface EventsListViewProps {
  view: EventView;
  events: OrganizerDashboardEvent[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  searchTerm: string;
  statusFilter: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (filter: string) => void;
}

const viewConfig: Record<EventView, { emptyIcon: typeof Calendar; emptyTitle: string; emptyMessage: string; searchPlaceholder: string }> = {
  all: {
    emptyIcon: Calendar,
    emptyTitle: "No events found",
    emptyMessage: "Get started by creating your first event.",
    searchPlaceholder: "Search events by title, location, or category...",
  },
  upcoming: {
    emptyIcon: Clock,
    emptyTitle: "No upcoming events",
    emptyMessage: "You don't have any upcoming events yet.",
    searchPlaceholder: "Search upcoming events...",
  },
  past: {
    emptyIcon: Calendar,
    emptyTitle: "No past events",
    emptyMessage: "You don't have any completed events yet.",
    searchPlaceholder: "Search past events...",
  },
  cancelled: {
    emptyIcon: XCircle,
    emptyTitle: "No cancelled events",
    emptyMessage: "You don't have any cancelled events.",
    searchPlaceholder: "Search cancelled events...",
  },
};

export function EventsListView({
  view,
  events,
  loading,
  error,
  page,
  limit,
  totalPages,
  total,
  searchTerm,
  statusFilter,
  onPageChange,
  onLimitChange,
  onSearchChange,
  onStatusFilterChange,
}: EventsListViewProps) {
  const config = viewConfig[view];

  // Compact inline stats
  const totalEvents = total || events.length;
  const activeCount = events.filter(
    (e) => e.status === "active" || e.status === "approved"
  ).length;
  const totalRevenue = events.reduce(
    (sum, e) => sum + (typeof e.revenue === "number" ? e.revenue : 0),
    0
  );
  const totalAttendees = events.reduce(
    (sum, e) => sum + (typeof e.attendees === "number" ? e.attendees : 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Search + Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={config.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {view === "all" && (
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
          <Select
            value={limit.toString()}
            onValueChange={(value) => onLimitChange(parseInt(value, 10))}
          >
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
      </div>

      {/* Compact Stats Strip */}
      {!loading && events.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{totalEvents}</span> events
          </span>
          {view === "all" && activeCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-success" />
              <span className="font-medium text-foreground">{activeCount}</span> active
            </span>
          )}
          {totalAttendees > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{totalAttendees.toLocaleString()}</span> attendees
            </span>
          )}
          {totalRevenue > 0 && (
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-success" />
              <span className="font-medium text-foreground">${totalRevenue.toLocaleString()}</span> revenue
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-16">
          <Loader size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <OrganizerEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <config.emptyIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {config.emptyTitle}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : config.emptyMessage}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              onPageChange(newPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
}
