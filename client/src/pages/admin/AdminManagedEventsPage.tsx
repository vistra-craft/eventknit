/**
 * AdminManagedEventsPage
 *
 * Platform-managed events — events commissioned by corporate, NGO, or government
 * clients that EventKnit staff organises and runs directly (not via organiser accounts).
 * Provides full organiser-equivalent management: create, edit, staff, tickets, analytics.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Search,
  Plus,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  MapPin,
  MoreHorizontal,
  Edit,
  Monitor,
  BarChart3,
  Ticket,
  Building2,
  Filter,
  ChevronDown,
  Briefcase,
  Loader2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useToast } from "@/hooks/useToast";
import {
  getManagedEvents,
  getManagedEventStats,
  cancelManagedEvent,
  type ManagedEvent,
  type ManagedEventStats,
} from "@/lib/managed-events-api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ManagedEventStatus = "draft" | "upcoming" | "active" | "completed" | "cancelled";

const STATUS_STYLES: Record<ManagedEventStatus, string> = {
  draft:      "bg-muted text-muted-foreground border-border",
  upcoming:   "bg-blue-500/10 text-blue-600 border-blue-500/20",
  active:     "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  completed:  "bg-muted text-muted-foreground border-border",
  cancelled:  "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_LABELS: Record<ManagedEventStatus, string> = {
  draft:     "Draft",
  upcoming:  "Upcoming",
  active:    "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

function statusStyle(s: string): string {
  return STATUS_STYLES[s as ManagedEventStatus] ?? "bg-muted text-muted-foreground border-border";
}

function statusLabel(s: string): string {
  return STATUS_LABELS[s as ManagedEventStatus] ?? s;
}

const CLIENT_TYPE_STYLES: Record<string, string> = {
  CORPORATE:  "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  NGO:        "bg-teal-500/10 text-teal-600 border-teal-500/20",
  GOVERNMENT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  PLATFORM:   "bg-violet-500/10 text-violet-600 border-violet-500/20",
  OTHER:      "bg-muted text-muted-foreground border-border",
};

const CLIENT_TYPE_LABELS: Record<string, string> = {
  CORPORATE:  "Corporate",
  NGO:        "NGO",
  GOVERNMENT: "Government",
  PLATFORM:   "Platform",
  OTHER:      "Other",
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminManagedEventsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [stats, setStats] = useState<ManagedEventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");

  // ── Data fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eventsData, statsData] = await Promise.all([
          getManagedEvents({
            status: statusFilter !== "all" ? statusFilter : undefined,
            clientType: clientTypeFilter !== "all" ? clientTypeFilter : undefined,
            search: searchTerm || undefined,
          }),
          getManagedEventStats(),
        ]);
        setEvents(eventsData.data?.events ?? []);
        setStats(statsData.data?.stats ?? null);
      } catch {
        toast({
          title: "Failed to load managed events",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, clientTypeFilter, searchTerm]);

  // ── Cancel handler ───────────────────────────────────────────────────────
  const handleCancel = async (eventId: string) => {
    try {
      await cancelManagedEvent(eventId);
      toast({ title: "Event cancelled successfully" });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "CANCELLED" } : e))
      );
    } catch {
      toast({ title: "Failed to cancel event", variant: "destructive" });
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalEvents   = stats?.total   ?? events.length;
  const activeEvents  = stats?.active  ?? events.filter(e => e.status.toLowerCase() === "active").length;
  const upcomingEvents = stats?.upcoming ?? events.filter(e => e.status.toLowerCase() === "upcoming").length;

  // ── Client-side search filter (supplements server-side for responsiveness) ──
  const filteredEvents = events.filter(e => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.clientName ?? "").toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
    );
  });

  const statsCards = [
    {
      title: "Total Managed",
      value: totalEvents.toLocaleString(),
      icon: Briefcase,
      gradient: "from-indigo-500 to-indigo-600",
      description: "Platform-owned events",
    },
    {
      title: "Active Now",
      value: activeEvents.toLocaleString(),
      icon: CheckCircle,
      gradient: "from-emerald-500 to-emerald-600",
      description: "Currently running",
    },
    {
      title: "Upcoming",
      value: upcomingEvents.toLocaleString(),
      icon: Clock,
      gradient: "from-blue-500 to-blue-600",
      description: "Scheduled events",
    },
    {
      title: "Client Types",
      value: stats ? String(stats.byClientType.length) : "—",
      icon: Building2,
      gradient: "from-amber-500 to-orange-500",
      description: "Distinct client sectors",
    },
  ];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Managed Events</h1>
          <p className="text-sm text-muted-foreground">
            Events commissioned and run directly by EventKnit for corporate, NGO, and government clients.
          </p>
        </div>
        <Button
          onClick={() => navigate("/admin/managed-events/create")}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Managed Event
        </Button>
      </div>

      {/* ── Stats Cards ── */}
      <section className="sticky top-0 z-10 bg-background pb-2 pt-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div
                    className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Filters ── */}
      <Card className="border-0 bg-card-surface rounded-2xl shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events or clients…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger>
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Client Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Client Types</SelectItem>
                <SelectItem value="CORPORATE">Corporate</SelectItem>
                <SelectItem value="NGO">NGO</SelectItem>
                <SelectItem value="GOVERNMENT">Government</SelectItem>
                <SelectItem value="PLATFORM">Platform</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {(statusFilter !== "all" || clientTypeFilter !== "all" || searchTerm) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filters:</span>
              {searchTerm && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => setSearchTerm("")}
                >
                  "{searchTerm}" ×
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => setStatusFilter("all")}
                >
                  {statusLabel(statusFilter)} ×
                </Badge>
              )}
              {clientTypeFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => setClientTypeFilter("all")}
                >
                  {CLIENT_TYPE_LABELS[clientTypeFilter] ?? clientTypeFilter} ×
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Event List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading managed events…</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          hasFilters={statusFilter !== "all" || clientTypeFilter !== "all" || !!searchTerm}
          onClear={() => {
            setSearchTerm("");
            setStatusFilter("all");
            setClientTypeFilter("all");
          }}
          onCreateNew={() => navigate("/admin/managed-events/create")}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
            </p>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              Sort <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onNavigate={navigate}
              onCancel={handleCancel}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: ManagedEvent;
  onNavigate: ReturnType<typeof useNavigate>;
  onCancel: (id: string) => void;
  formatDate: (d: string) => string;
}

const EventCard = ({ event, onNavigate, onCancel, formatDate }: EventCardProps) => {
  const registrations = event._count?.registrations ?? 0;
  const capacity = event.capacity ?? 0;
  const attendancePct = capacity > 0 ? Math.round((registrations / capacity) * 100) : 0;

  const statusKey = event.status.toLowerCase();
  const clientTypeKey = event.clientType ?? "OTHER";

  return (
    <div className="group rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">

          {/* Left: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge
                variant="outline"
                className={`text-xs font-medium ${statusStyle(statusKey)}`}
              >
                {statusLabel(statusKey)}
              </Badge>
              {event.clientType && (
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${CLIENT_TYPE_STYLES[clientTypeKey]}`}
                >
                  {CLIENT_TYPE_LABELS[clientTypeKey]}
                </Badge>
              )}
              {event.isFree && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  Free
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-foreground truncate text-sm md:text-base">
              {event.title}
            </h3>
            {event.clientName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Client: <span className="font-medium text-foreground">{event.clientName}</span>
              </p>
            )}

            {/* Meta row */}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(event.startDate)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
              {capacity > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {registrations.toLocaleString()} / {capacity.toLocaleString()}
                  <span className="ml-1 text-muted-foreground/60">({attendancePct}%)</span>
                </span>
              )}
              {!event.isFree && event.price != null && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  KES {event.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Capacity bar */}
            {capacity > 0 && registrations > 0 && (
              <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    attendancePct >= 90
                      ? "bg-destructive"
                      : attendancePct >= 70
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(attendancePct, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Right: Quick actions + overflow */}
          <div className="flex items-start gap-3 shrink-0">
            {/* Quick action buttons (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => onNavigate(`/admin/event-day/event/${event.id}`)}
              >
                <Monitor className="h-3.5 w-3.5" />
                Event Day
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => onNavigate(`/admin/events/${event.id}`)}
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>

            {/* Overflow menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onNavigate(`/admin/events/${event.id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(`/admin/event-day/event/${event.id}`)}>
                  <Monitor className="mr-2 h-4 w-4" />
                  Event Day Hub
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(`/admin/analytics/events?id=${event.id}`)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(`/admin/tickets/advanced?event=${event.id}`)}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Manage Tickets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(`/admin/staff-performance?event=${event.id}`)}>
                  <Users className="mr-2 h-4 w-4" />
                  Staff Assignments
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onCancel(event.id)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  hasFilters: boolean;
  onClear: () => void;
  onCreateNew: () => void;
}

const EmptyState = ({ hasFilters, onClear, onCreateNew }: EmptyStateProps) => (
  <div className="rounded-2xl border border-border/40 bg-card">
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Briefcase className="h-8 w-8 text-muted-foreground" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-base font-semibold text-foreground mb-1">No events match your filters</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Try adjusting your search or clearing the filters to see all managed events.
          </p>
          <Button variant="outline" onClick={onClear}>
            Clear Filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-foreground mb-1">No managed events yet</h3>
          <p className="text-sm text-muted-foreground mb-2 max-w-sm">
            Managed events are events commissioned by corporate, NGO, or government clients
            that EventKnit staff organises and runs directly.
          </p>
          <p className="text-xs text-muted-foreground mb-6 max-w-sm">
            Create the first managed event to get started.
          </p>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Managed Event
          </Button>
        </>
      )}
    </div>
  </div>
);

export default AdminManagedEventsPage;
